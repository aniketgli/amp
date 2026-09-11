import type { Express } from "express";

import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";

import { profilePhotoUpload } from "../middleware/upload";

import {
  getMyProfile,
  getMyProfilePhoto,
  getUserProfile,
  updateMyProfile,
  uploadProfilePhoto,
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
  /* ==========================================================
     CURRENT AUTHENTICATED USER PROFILE
     ========================================================== */

  app.get("/api/profile", authenticateToken, getMyProfile);

  app.put("/api/profile", authenticateToken, updateMyProfile);

  /* ==========================================================
     CURRENT USER PROFILE PHOTO
     ========================================================== */

  /*
   * Get current user's photo.
   *
   * The authenticated session determines the user.
   */
  app.get("/api/profile/photo", authenticateToken, getMyProfilePhoto);

  /*
   * Upload / replace current user's photo.
   *
   * Multipart field:
   *   photo
   */
  app.post(
    "/api/profile/photo",
    authenticateToken,
    profilePhotoUpload.single("photo"),
    uploadProfilePhoto,
  );

  /* ==========================================================
     DIRECTORY PROFILE LOOKUP
     ========================================================== */

  app.get(
    "/api/profile/:userId",
    authenticateToken,
    requireRole(...PROFILE_DIRECTORY_ROLES),
    getUserProfile,
  );
}
