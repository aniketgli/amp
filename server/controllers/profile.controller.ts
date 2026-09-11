import type { Request, Response } from "express";

import {
  getApplicantProfile,
  saveApplicantProfile,
} from "../services/profile.service";

import {
  getProfilePhoto,
  saveProfilePhoto,
} from "../services/profile-photo.service";

/* ============================================================
   AUTHENTICATED USER
   ============================================================ */

function getAuthenticatedUserId(req: Request): number | null {
  const userId = (req as any).user?.userId;

  if (userId === undefined || userId === null || userId === "") {
    return null;
  }

  const numericUserId = Number(userId);

  if (!Number.isSafeInteger(numericUserId) || numericUserId <= 0) {
    return null;
  }

  return numericUserId;
}

/* ============================================================
   AUDIT REQUEST CONTEXT
   ============================================================ */

function getClientIp(req: Request): string | null {
  /*
   * req.ip is the canonical application-level
   * client IP after Express proxy configuration.
   *
   * We do not trust a raw X-Forwarded-For value here.
   */
  return req.ip || null;
}

function getUserAgent(req: Request): string | null {
  const userAgent = req.get("user-agent");

  if (!userAgent) {
    return null;
  }

  return userAgent.slice(0, 500);
}

/* ============================================================
   REQUEST BODY
   ============================================================ */

function getRequestBody(req: Request): Record<string, unknown> | null {
  const body = req.body;

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as Record<string, unknown>;
}

/* ============================================================
   ERROR RESPONSE
   ============================================================ */

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/* ============================================================
   GET MY PROFILE
   ============================================================ */

export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    const profile = await getApplicantProfile(userId);

    return res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("GET /api/profile ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch applicant profile.",
    });
  }
}

/* ============================================================
   GET MY PROFILE PHOTO
   ============================================================ */

/**
 * Returns the authenticated user's profile photo.
 *
 * The user ID is ALWAYS taken from the authenticated session.
 * No user ID is accepted from the URL or request body.
 */
export async function getMyProfilePhoto(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    const photo = await getProfilePhoto(userId);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Profile photo not found.",
      });
    }

    /*
     * Prevent browser/proxy caching of an authenticated user's
     * profile image.
     *
     * This ensures that after replacing a photo, the browser
     * does not continue showing an old cached image.
     */
    res.setHeader("Cache-Control", "private, no-store, max-age=0");

    res.setHeader("X-Content-Type-Options", "nosniff");

    res.type(photo.contentType);

    return res.send(photo.buffer);
  } catch (error) {
    console.error("GET /api/profile/photo ERROR:", error);

    return res.status(404).json({
      success: false,
      message: "Unable to load profile photo.",
    });
  }
}

/* ============================================================
   GET ANOTHER USER PROFILE
   ============================================================ */

export async function getUserProfile(req: Request, res: Response) {
  try {
    const rawUserId = req.params.userId;

    if (!rawUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const numericUserId = Number(rawUserId);

    if (!Number.isSafeInteger(numericUserId) || numericUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID.",
      });
    }

    const profile = await getApplicantProfile(numericUserId);

    return res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("GET /api/profile/:userId ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch applicant profile.",
    });
  }
}

/* ============================================================
   UPDATE MY PROFILE
   ============================================================ */

export async function updateMyProfile(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    const body = getRequestBody(req);

    if (!body) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile data.",
      });
    }

    /*
     * IMPORTANT SECURITY RULE:
     *
     * The client cannot supply:
     *
     *   userId
     *   changedByUserId
     *   audit actor
     *
     * as authoritative values.
     *
     * They are derived from the authenticated
     * server-side session.
     */

    const profile = await saveApplicantProfile(userId, body, userId, {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return res.json({
      success: true,
      message: "Applicant profile updated successfully.",
      profile,
    });
  } catch (error) {
    console.error("PUT /api/profile ERROR:", error);

    const message = getErrorMessage(
      error,
      "Unable to update applicant profile.",
    );

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

/* ============================================================
   UPLOAD / REPLACE PROFILE PHOTO
   ============================================================ */

/**
 * Upload or replace the authenticated user's profile photo.
 *
 * The target user is ALWAYS derived from the authenticated
 * session. The client cannot choose another user.
 *
 * File parsing is performed by the route-level multer
 * middleware before this controller runs.
 */
export async function uploadProfilePhoto(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Profile photo file is required.",
      });
    }

    const profile = await saveProfilePhoto(
      userId,
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
      {
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    );

    return res.json({
      success: true,
      message: "Profile photo updated successfully.",
      profile,
    });
  } catch (error) {
    console.error("POST /api/profile/photo ERROR:", error);

    const message = getErrorMessage(error, "Unable to update profile photo.");

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
