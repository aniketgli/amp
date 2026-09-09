import { apiRequest } from "./apiClient";

export interface LoginInput {
  email: string;
  password: string;
  requestedRole?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;

  currentRole: {
    id: number;
    code: string;
    name: string;
  };

  user: {
    id: number;
    employeeId?: string | null;
    fullName: string;
    email: string;
    phone: string;
    intercomExtension?: string | null;
    status: string;
    isActivated: boolean;

    roles: Array<{
      id: number;
      code: string;
      name: string;
    }>;
  };
}

export async function loginUser(input: LoginInput): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function registerUser(input: Record<string, unknown>): Promise<{
  success: boolean;
  message: string;
  [key: string]: unknown;
}> {
  return apiRequest<{
    success: boolean;
    message: string;
    [key: string]: unknown;
  }>("/api/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Persist the authenticated API session in one place.
 */
export function saveLoginSession(response: LoginResponse): void {
  localStorage.setItem("wii_auth_token", response.token);

  localStorage.setItem("wii_user", JSON.stringify(response.user));

  // Store only the role code, not the complete role object.
  localStorage.setItem(
    "wii_current_role",
    response.currentRole?.code || "applicant",
  );
}

export interface StoredLoginSession {
  token: string;
  user: LoginResponse["user"];
  currentRole: string | null;
}

/**
 * Restore the saved authenticated session.
 */
export function getLoginSession(): StoredLoginSession | null {
  try {
    const token = localStorage.getItem("wii_auth_token");
    const storedUser = localStorage.getItem("wii_user");
    const currentRole = localStorage.getItem("wii_current_role");

    if (!token || !storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser) as LoginResponse["user"];

    if (!user || typeof user !== "object") {
      return null;
    }

    return {
      token,
      user,
      currentRole,
    };
  } catch (error) {
    console.warn("Unable to read saved login session:", error);

    return null;
  }
}

/**
 * Update only the currently selected frontend persona.
 */
export function setStoredCurrentRole(role: string): void {
  localStorage.setItem("wii_current_role", role);
}

/**
 * Clear all client-side authentication/session data.
 */
export function clearLoginSession(): void {
  localStorage.removeItem("wii_auth_token");
  localStorage.removeItem("wii_user");
  localStorage.removeItem("wii_current_role");
}
