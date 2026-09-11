import type { Express } from "express";

import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";

import {
  updateUserProfileAsAdminController,
} from "../controllers/profile-admin.controller";

/* ============================================================
   ADMIN PROFILE ROUTES
   ============================================================ */

export function registerProfileAdminRoutes(
  app: Express,
) {
  /*
   * IMPORTANT SECURITY BOUNDARY
   *
   * Authentication:
   *   The request must have a valid server-side session.
   *
   * Authorization:
   *   Only the administrator role can access this endpoint.
   *
   * The controller then obtains the administrator's ID from
   * the authenticated session. It never trusts the request body.
   */
  app.put(
    "/api/admin/profile/:userId",
    authenticateToken,
    requireRole("administrator"),
    updateUserProfileAsAdminController,
  );
}
