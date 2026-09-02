// ============================================================
// Central authenticated API transport
// ============================================================
// Transitional security layer for the existing fetch-based UI.
// It automatically attaches the current JWT to same-origin API
// requests so protected endpoints do not need to be edited one by one.
//
// This keeps the existing components compatible while we migrate the
// session to an HttpOnly cookie in the next security phase.
// ============================================================

const AUTH_TOKEN_KEY = "wii_auth_token";

const PUBLIC_API_PATHS = new Set([
  "/api/login",
  "/api/register",
  "/api/health",
  "/api/db-test",
  "/api/db/test",
  "/api/email-test",
]);

let installed = false;
let sessionCheckStarted = false;

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem("wii_user");
    localStorage.removeItem("wii_current_role");
  } catch {
    // Ignore storage errors.
  }
}

export function installAuthenticatedFetch(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
  ) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const isApiRequest = url.startsWith("/api/") || url.includes("/api/");

    const pathname = (() => {
      try {
        return new URL(url, window.location.origin).pathname;
      } catch {
        return url;
      }
    })();

    if (!isApiRequest || PUBLIC_API_PATHS.has(pathname)) {
      return originalFetch(input, init);
    }

    const token = getAuthToken();
    const headers = new Headers(init.headers || {});

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await originalFetch(input, {
      ...init,
      headers,
    });

    if (response.status === 401 && token) {
      clearAuthSession();
      window.dispatchEvent(new CustomEvent("amp:auth-expired"));
    }

    return response;
  };
}

export async function validateStoredSession(): Promise<boolean> {
  if (sessionCheckStarted || typeof window === "undefined") return true;

  const token = getAuthToken();
  if (!token) return true;

  sessionCheckStarted = true;

  try {
    const response = await window.fetch("/api/me", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (response.ok) return true;

    if (response.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new CustomEvent("amp:auth-expired"));
      return false;
    }

    return true;
  } catch {
    // Do not destroy a local session merely because the network is temporarily unavailable.
    return true;
  }
}

installAuthenticatedFetch();
