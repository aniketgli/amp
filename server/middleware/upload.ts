import multer from "multer";

/* ============================================================
   PROFILE PHOTO UPLOAD
   ============================================================ */

/*
 * Files are kept in memory first.
 *
 * We intentionally do NOT write uploaded files directly to disk.
 * The controller/service will validate the file and decide where
 * it should be stored.
 */

const PROFILE_PHOTO_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_PROFILE_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const profilePhotoUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: PROFILE_PHOTO_MAX_SIZE,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_PROFILE_PHOTO_MIME_TYPES.has(file.mimetype)) {
      return callback(
        new Error("Only JPEG, PNG, and WebP profile photos are allowed."),
      );
    }

    callback(null, true);
  },
});
