import type { Express } from "express";

import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";
import {
  getMyProfile,
  getUserProfile,
  updateMyProfile,
} from "../controllers/profile.controller";

const PROFILE_DIRECTORY_ROLES = [
  "admin",
  "super_admin",
  "supervisor",
  "lab_nodal",
  "assoc_lab_nodal",
  "it_officer",
  "hrms_officer",
  "section_head",
] as const;

export function registerProfileRoutes(app: Express) {
  // Current authenticated user's profile.
  app.get("/api/profile", authenticateToken, getMyProfile);

  // Update current authenticated user's profile.
  app.put("/api/profile", authenticateToken, updateMyProfile);

  // Directory profile lookup for authorized officers.
  app.get(
    "/api/profile/:userId",
    authenticateToken,
    requireRole(...PROFILE_DIRECTORY_ROLES),
    getUserProfile,
  );
}
