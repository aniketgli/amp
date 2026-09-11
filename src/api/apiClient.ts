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

// A temporary network/backend failure must not be treated as an expired
// session. The probe is retried a small number of times before it gives up.
const SESSION_PROBE_MAX_ATTEMPTS = 3;
const SESSION_PROBE_RETRY_DELAY_MS = 500;

let installed = false;

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

/** Authentication tokens are intentionally inaccessible to frontend JS. */
export function getAuthToken(): null {
  return null;
}

/** Inform the app that a protected API rejected its authenticated session. */
export function clearAuthSession(): void {
  notifyAuthExpired();
}

// ============================================================
// AUTH EXPIRY EVENT
// ============================================================

function notifyAuthExpired(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("amp:auth-expired"));
}

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

    if (
      isApiRequest(url) &&
      !isPublicApiPath(pathname) &&
      !isSessionProbePath(pathname) &&
      response.status === 401
    ) {
      notifyAuthExpired();
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

// ============================================================
// GENERIC JSON API HELPER
// ============================================================

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
