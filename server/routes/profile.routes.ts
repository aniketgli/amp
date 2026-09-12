import type { Express } from "express";

import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";
import { validateProfileUpdate } from "../middleware/profile-update-validation";
import { profilePhotoUpload } from "../middleware/upload";

import {
  getMyProfile,
  getMyProfilePhoto,
  getUserProfile,
  updateMyProfile,
  uploadProfilePhoto,
} from "../controllers/profile.controller";
import { lookupProfilePincode } from "../controllers/profile-pincode.controller";

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

  app.put(
    "/api/profile",
    authenticateToken,
    validateProfileUpdate,
    updateMyProfile,
  );

  /* ==========================================================
     CURRENT USER PROFILE PHOTO
     ========================================================== */

  app.get("/api/profile/photo", authenticateToken, getMyProfilePhoto);

  app.post(
    "/api/profile/photo",
    authenticateToken,
    profilePhotoUpload.single("photo"),
    uploadProfilePhoto,
  );

  /* ==========================================================
     PIN CODE LOOKUP
     ========================================================== */

  app.get(
    "/api/profile/pincode/:pincode",
    authenticateToken,
    lookupProfilePincode,
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
