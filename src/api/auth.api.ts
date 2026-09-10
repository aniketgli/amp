import { apiRequest } from "./apiClient";

// ============================================================
// AUTH API
// ============================================================
//
// FINAL AUTHENTICATION MODEL
//
// Frontend:
//   - Never stores JWT
//   - Never reads JWT
//   - Never decides real permissions
//
// Backend:
//   - Authenticates user
//   - Creates HttpOnly authentication cookie
//   - Returns safe user information
//
// Database:
//   - Source of truth
// ============================================================

export interface LoginInput {
  email: string;
  password: string;
  requestedRole?: string;
}

// ============================================================
// AUTH ROLE
// ============================================================

export interface AuthRole {
  id: number;
  code: string;
  name: string;
}

// ============================================================
// AUTH USER
// ============================================================

export interface AuthUser {
  id: number;
  employeeId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  intercomExtension?: string | null;
  status: string;
  isActivated: boolean;
  roles: AuthRole[];
}

// ============================================================
// BACKWARD-COMPATIBLE TYPE
// ============================================================
//
// Existing App.tsx and other UI modules may still import
// AuthenticatedUser. It is intentionally an alias of the
// backend-authoritative AuthUser type.
//
// This does NOT create a separate frontend authentication model.
// ============================================================

export type AuthenticatedUser = AuthUser;

// ============================================================
// LOGIN RESPONSE
// ============================================================
//
// IMPORTANT:
// JWT is intentionally NOT returned to frontend JavaScript.
//
// Backend sets:
//   HttpOnly authentication cookie
//
// Frontend receives only safe user/session information.
// ============================================================

export interface LoginResponse {
  success: boolean;
  message: string;
  currentRole: AuthRole;
  user: AuthUser;
}

// ============================================================
// CURRENT USER RESPONSE
// ============================================================
//
// /api/me is the authoritative session check.
//
// Backend:
//   HttpOnly cookie
//        ↓
//   JWT verification
//        ↓
//   MySQL user
//        ↓
//   MySQL roles
// ============================================================

export interface MeResponse {
  success: boolean;
  user: AuthUser;
}

// ============================================================
// REGISTRATION RESPONSE
// ============================================================

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: number;
  email?: string;
}

// ============================================================
// ACTIVATION RESPONSE
// ============================================================

export interface ActivationResponse {
  success: boolean;
  message: string;
  alreadyActivated?: boolean;

  user?: {
    id: number;
    employeeId?: string | null;
    fullName: string;
    email: string;
  };
}

// ============================================================
// LOGOUT RESPONSE
// ============================================================

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// ============================================================
// LOGIN
// ============================================================
//
// POST /api/login
//
// Backend:
//   1. Validate credentials.
//   2. Check account state.
//   3. Resolve DB-assigned roles.
//   4. Create authentication session.
//   5. Set HttpOnly cookie.
//
// Frontend never stores the JWT.
// ============================================================

export async function loginUser(input: LoginInput): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/login", {
    method: "POST",

    body: JSON.stringify({
      email: input.email,
      password: input.password,

      ...(input.requestedRole
        ? {
            requestedRole: input.requestedRole,
          }
        : {}),
    }),
  });
}

// ============================================================
// REGISTER
// ============================================================
//
// IMPORTANT:
// Frontend does NOT send a role.
//
// Backend/database assigns:
//   user
//
// Registration creates an inactive account until the
// activation link is successfully used.
// ============================================================

export async function registerUser(
  input: Record<string, unknown>,
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/api/register", {
    method: "POST",

    body: JSON.stringify({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      password: input.password,
    }),
  });
}

// ============================================================
// ACTIVATE ACCOUNT
// ============================================================
//
// GET /api/activate/:token
//
// The activation token comes from the email link.
//
// Frontend:
//   - Does not validate the token itself.
//   - Does not activate the account locally.
//   - Sends the token to backend.
//
// Backend:
//   - Validates token.
//   - Validates expiry/state.
//   - Activates the DB account.
//   - Invalidates the token after successful activation.
// ============================================================

export async function activateUser(token: string): Promise<ActivationResponse> {
  const cleanToken = String(token || "").trim();

  if (!cleanToken) {
    throw new Error("Activation token is required.");
  }

  return apiRequest<ActivationResponse>(
    `/api/activate/${encodeURIComponent(cleanToken)}`,
    {
      method: "GET",
    },
  );
}

// ============================================================
// CURRENT USER
// ============================================================
//
// GET /api/me
//
// This is the authoritative authentication restore endpoint.
//
// No token is read from:
//   - localStorage
//   - sessionStorage
//   - frontend state
//
// Authentication is determined by the backend.
// ============================================================

export async function getCurrentUser(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/me", {
    method: "GET",
  });
}

// ============================================================
// LOGOUT
// ============================================================
//
// POST /api/logout
//
// Backend clears the HttpOnly authentication cookie.
//
// Frontend does not attempt to delete/read the JWT itself.
// ============================================================

export async function logoutUser(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>("/api/logout", {
    method: "POST",
  });
}

// ============================================================
// LEGACY SESSION COMPATIBILITY
// ============================================================
//
// These exports are retained temporarily because older
// application modules may still import them.
//
// IMPORTANT:
// They intentionally DO NOT store authentication data.
//
// Final authentication state:
//   Backend session cookie + /api/me
// ============================================================

export interface StoredLoginSession {
  token: null;
  user: AuthUser;
  currentRole: string | null;
}

// ============================================================
// LEGACY TOKEN HELPER
// ============================================================
//
// JWT is HttpOnly and therefore inaccessible to JavaScript.
//
// Always returns null.
// ============================================================

export function getAuthToken(): null {
  return null;
}

// ============================================================
// LEGACY LOGIN SESSION HELPER
// ============================================================
//
// Intentionally empty.
//
// DO NOT add localStorage/sessionStorage here.
// ============================================================

export function saveLoginSession(_response: LoginResponse): void {
  // Intentionally empty.
}

// ============================================================
// LEGACY ROLE STORAGE HELPER
// ============================================================
//
// Current role is UI persona state only.
//
// Real authorization is always performed by backend/database.
// ============================================================

export function setStoredCurrentRole(_role: string): void {
  // Intentionally empty.
}

// ============================================================
// LEGACY CLEAR SESSION HELPER
// ============================================================
//
// This function does NOT clear the HttpOnly cookie.
//
// Actual logout:
//   await logoutUser()
// ============================================================

export function clearLoginSession(): void {
  // Intentionally empty.
}
