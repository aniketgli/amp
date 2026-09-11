// ============================================================
// CENTRAL API TRANSPORT
// ============================================================
//
// FINAL AUTHENTICATION MODEL
//
// Frontend:
//   - Does NOT read or store authentication tokens
//   - Does NOT decide authentication authority
//
// Browser:
//   - Automatically sends the HttpOnly session cookie
//
// Backend:
//   - Validates the server-side session against the database
//   - Re-checks the current user/account state
//   - Enforces authorization
//
// Database:
//   - Source of truth
//
// Session lifetime/idle policy is intentionally invisible to the UI.
// ============================================================

const PUBLIC_API_PATHS = new Set([
  "/api/login",
  "/api/register",
  "/api/health",
  "/api/db-test",
  "/api/db/test",
  "/api/email-test",
]);

const SESSION_PROBE_PATH = "/api/me";
const LOGOUT_PATH = "/api/logout";

const SESSION_PROBE_MAX_ATTEMPTS = 3;
const SESSION_PROBE_RETRY_DELAY_MS = 500;

const AUTH_SYNC_CHANNEL_NAME = "amp-auth-sync";
const AUTH_SYNC_STORAGE_KEY = "amp_auth_sync_event";

let installed = false;
let authSyncInitialized = false;
let authSyncChannel: BroadcastChannel | null = null;

function isApiRequest(url: string): boolean {
  return url.startsWith("/api/") || url.includes("/api/");
}

function getPathname(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}

function isPublicApiPath(pathname: string): boolean {
  if (PUBLIC_API_PATHS.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/api/activate/")) {
    return true;
  }

  return false;
}

function isSessionProbePath(pathname: string): boolean {
  return pathname === SESSION_PROBE_PATH;
}

// ============================================================
// AUTH SESSION HELPERS
// ============================================================

export function getAuthToken(): null {
  return null;
}

export function clearAuthSession(): void {
  notifyAuthExpired(true);
}

// ============================================================
// AUTH EXPIRY / CROSS-TAB SYNCHRONIZATION
// ============================================================
//
// Only a logout/invalidation event is synchronized. No token, session ID,
// user information or expiry information is ever stored or broadcast.
// ============================================================

function dispatchAuthExpired(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("amp:auth-expired"));
}

function initializeAuthSync(): void {
  if (
    authSyncInitialized ||
    typeof window === "undefined" ||
    typeof window.addEventListener !== "function"
  ) {
    return;
  }

  authSyncInitialized = true;

  if (typeof BroadcastChannel !== "undefined") {
    try {
      authSyncChannel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME);

      authSyncChannel.addEventListener("message", (event: MessageEvent) => {
        if (event.data?.type === "logout") {
          dispatchAuthExpired();
        }
      });
    } catch {
      authSyncChannel = null;
    }
  }

  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key !== AUTH_SYNC_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      const payload = JSON.parse(event.newValue) as { type?: string };

      if (payload.type === "logout") {
        dispatchAuthExpired();
      }
    } catch {
      // Ignore malformed synchronization events.
    }
  });
}

export function broadcastAuthLogout(): void {
  if (typeof window === "undefined") {
    return;
  }

  initializeAuthSync();

  const event = {
    type: "logout",
    at: Date.now(),
  };

  try {
    authSyncChannel?.postMessage(event);
  } catch {
    // Storage fallback remains available.
  }

  try {
    window.localStorage.setItem(AUTH_SYNC_STORAGE_KEY, JSON.stringify(event));
    window.localStorage.removeItem(AUTH_SYNC_STORAGE_KEY);
  } catch {
    // Cross-tab sync is best-effort UX; the server session remains authoritative.
  }
}

function notifyAuthExpired(broadcast = false): void {
  if (typeof window === "undefined") {
    return;
  }

  dispatchAuthExpired();

  if (broadcast) {
    broadcastAuthLogout();
  }
}

initializeAuthSync();

// ============================================================
// FETCH INSTALLATION
// ============================================================

export function installAuthenticatedFetch(): void {
  if (installed || typeof window === "undefined") {
    return;
  }

  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const pathname = getPathname(url);

    const requestInit: RequestInit = {
      ...init,
      credentials: init.credentials || "include",
    };

    const response = await originalFetch(input, requestInit);

    if (pathname === LOGOUT_PATH && response.ok) {
      broadcastAuthLogout();
    }

    if (
      isApiRequest(url) &&
      !isPublicApiPath(pathname) &&
      !isSessionProbePath(pathname) &&
      pathname !== LOGOUT_PATH &&
      response.status === 401
    ) {
      notifyAuthExpired(true);
    }

    return response;
  };
}

// ============================================================
// SESSION PROBE RETRY
// ============================================================

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export async function validateStoredSession(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  for (let attempt = 1; attempt <= SESSION_PROBE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await window.fetch(SESSION_PROBE_PATH, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        return true;
      }

      if (response.status === 401 || response.status === 403) {
        return false;
      }
    } catch {
      // Network/server connectivity failure does not prove that the
      // server-side session is invalid. Retry silently.
    }

    if (attempt < SESSION_PROBE_MAX_ATTEMPTS) {
      await wait(SESSION_PROBE_RETRY_DELAY_MS * attempt);
    }
  }

  return false;
}

installAuthenticatedFetch();

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<T> {
  const requestHeaders = new Headers(init.headers || {});

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await window.fetch(input, {
    ...init,
    credentials: init.credentials || "include",
    headers: requestHeaders,
  });

  const contentType = response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String(
            (
              data as {
                message: unknown;
              }
            ).message,
          )
        : `API request failed with status ${response.status}.`;

    const error = new Error(message) as Error & {
      status?: number;
      data?: unknown;
    };

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data as T;
}
