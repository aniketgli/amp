// ============================================================
// WII ACCESS MANAGEMENT PORTAL
// FILE: src/app/routes.tsx
// ============================================================
//
// Central application route definitions.
//
// IMPORTANT:
// This file currently contains the route/tab mapping logic only.
// The actual page rendering will be moved here in a later step,
// after the current App.tsx behavior has been verified.
//
// Keeping this migration incremental prevents accidental changes
// to authentication, role handling, requisition state and UI.
// ============================================================

import type { UserRole } from "../types/requisition";

// ============================================================
// APPLICATION TAB / ROUTE TYPE
// ============================================================
//
// Keep all top-level application destinations in one type.
//
// The URL is the source of truth for page navigation, while
// activeTab remains a compatibility layer for the existing
// page components during the migration.
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
// APPLICATION ROUTE MAP
// ============================================================
//
// This map keeps the relationship between the internal
// AppTab value and the browser URL in one place.
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
// URL -> APPLICATION TAB
// ============================================================
//
// Converts the current browser pathname into the internal
// application tab.
//
// IMPORTANT:
// Keep this function outside React components.
// ============================================================

export const getTabFromPath = (pathname: string): AppTab => {
  // Authentication
  if (pathname === "/login" || pathname === "/auth") {
    return "auth";
  }

  // Dashboard
  if (pathname === "/" || pathname === "/dashboard") {
    return "dashboard";
  }

  // Profile
  if (pathname === "/profile") {
    return "profile";
  }

  // Requests
  if (pathname === "/requests") {
    return "my_requests";
  }

  // New request
  if (pathname === "/requests/new" || pathname === "/new-request") {
    return "new_request";
  }

  // Approval queue
  if (pathname === "/approval-queue" || pathname === "/approvals") {
    return "approval_queue";
  }

  // Helpdesk
  if (pathname === "/helpdesk") {
    return "helpdesk";
  }

  // Administrator / Master
  if (pathname === "/admin" || pathname === "/master") {
    return "super_admin_panel";
  }

  // Unknown path: fall back to dashboard.
  return "dashboard";
};

// ============================================================
// ROLE-SPECIFIC ROUTE HELPERS
// ============================================================
//
// These helpers are intentionally kept small for now.
//
// Actual authorization MUST remain enforced by the backend.
// These are frontend navigation helpers only.
// ============================================================

export const isAdminRoute = (tab: AppTab): boolean => {
  return tab === "super_admin_panel";
};

export const isApplicantRoute = (tab: AppTab): boolean => {
  return tab === "new_request";
};

export const canAccessRoute = (
  tab: AppTab,
  currentRole: UserRole,
): boolean => {
  // Admin route
  if (isAdminRoute(tab)) {
    return currentRole === "admin";
  }

  // New request is available only to the User/Applicant persona.
  if (isApplicantRoute(tab)) {
    return currentRole === "applicant" || currentRole === "user";
  }

  // Other top-level routes remain available to authenticated
  // users and continue to be handled by the existing App logic.
  return true;
};