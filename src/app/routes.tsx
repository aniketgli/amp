// ============================================================
// WII ACCESS MANAGEMENT PORTAL
// FILE: src/app/routes.tsx
// ============================================================
//
// Central route definitions.
//
// IMPORTANT:
// - Route matching is for FRONTEND NAVIGATION / UX.
// - Real authentication and authorization are enforced by backend.
// ============================================================

import type { UserRole } from "../types/requisition";

// ============================================================
// APPLICATION TAB / ROUTE TYPE
// ============================================================

export type AppTab =
  | "dashboard"
  | "profile"
  | "my_requests"
  | "new_request"
  | "approval_queue"
  | "helpdesk"
  | "super_admin_panel"
  | "auth";

// ============================================================
// ROUTE MAP
// ============================================================

export const APP_ROUTES: Record<AppTab, string> = {
  dashboard: "/",
  profile: "/profile",
  my_requests: "/requests",
  new_request: "/requests/new",
  approval_queue: "/approval-queue",
  helpdesk: "/helpdesk",
  super_admin_panel: "/admin",
  auth: "/login",
};

// ============================================================
// PUBLIC AUTH ROUTES
// ============================================================

export const AUTH_ROUTES = new Set(["/login", "/auth", "/register"]);

export const isAuthRoute = (pathname: string): boolean => {
  return AUTH_ROUTES.has(pathname);
};

export const isActivationRoute = (pathname: string): boolean => {
  return pathname.startsWith("/activate/");
};

// ============================================================
// PROTECTED ROUTES
// ============================================================
//
// These are application destinations requiring authentication.
// Backend still enforces real security.
// ============================================================

export const PROTECTED_ROUTES = new Set([
  "/",
  "/dashboard",
  "/profile",
  "/requests",
  "/requests/new",
  "/approval-queue",
  "/approvals",
  "/helpdesk",
  "/admin",
  "/master",
]);

export const isProtectedRoute = (pathname: string): boolean => {
  if (isActivationRoute(pathname)) {
    return false;
  }

  if (isAuthRoute(pathname)) {
    return false;
  }

  if (PROTECTED_ROUTES.has(pathname)) {
    return true;
  }

  // Any non-public application URL is treated as protected.
  //
  // This gives us the desired behavior for manually copied
  // protected URLs while the detailed route structure is
  // migrated incrementally.
  return pathname.startsWith("/");
};

// ============================================================
// RETURN-TO HELPERS
// ============================================================

export const buildLoginPath = (returnTo?: string): string => {
  if (!returnTo || returnTo === "/") {
    return "/login";
  }

  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
};

export const getSafeReturnTo = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);

    // Only allow local application paths.
    // Never redirect to an external origin.
    if (!decoded.startsWith("/")) {
      return null;
    }

    if (decoded.startsWith("//") || decoded.startsWith("/\\")) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

// ============================================================
// URL -> APPLICATION TAB
// ============================================================

export const getTabFromPath = (pathname: string): AppTab => {
  if (
    pathname === "/login" ||
    pathname === "/auth" ||
    pathname === "/register"
  ) {
    return "auth";
  }

  if (pathname === "/" || pathname === "/dashboard") {
    return "dashboard";
  }

  if (pathname === "/profile") {
    return "profile";
  }

  if (pathname === "/requests") {
    return "my_requests";
  }

  if (pathname === "/requests/new" || pathname === "/new-request") {
    return "new_request";
  }

  if (pathname === "/approval-queue" || pathname === "/approvals") {
    return "approval_queue";
  }

  if (pathname === "/helpdesk") {
    return "helpdesk";
  }

  if (pathname === "/admin" || pathname === "/master") {
    return "super_admin_panel";
  }

  return "dashboard";
};

// ============================================================
// FRONTEND ROLE HELPERS
// ============================================================
//
// These are navigation/UX helpers only.
// Backend authorization remains authoritative.
// ============================================================

export const isAdminRoute = (tab: AppTab): boolean => {
  return tab === "super_admin_panel";
};

export const isApplicantRoute = (tab: AppTab): boolean => {
  return tab === "new_request";
};

export const canAccessRoute = (tab: AppTab, currentRole: UserRole): boolean => {
  if (isAdminRoute(tab)) {
    return currentRole === "admin" || currentRole === "super_admin";
  }

  if (isApplicantRoute(tab)) {
    return currentRole === "applicant";
  }

  return true;
};
