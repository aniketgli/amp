import type { Request, Response } from "express";

import {
  getApplicantProfile,
  saveApplicantProfile,
} from "../services/profile.service";
import {
  getProfilePhoto,
  saveProfilePhoto,
} from "../services/profile-photo.service";
import { getPincodeDetails } from "../services/pincode.service";

function getAuthenticatedUserId(req: Request): number | null {
  const userId = (req as any).user?.userId;
  if (userId === undefined || userId === null || userId === "") return null;
  const numericUserId = Number(userId);
  return Number.isSafeInteger(numericUserId) && numericUserId > 0 ? numericUserId : null;
}

function getClientIp(req: Request): string | null {
  return req.ip || null;
}

function getUserAgent(req: Request): string | null {
  const userAgent = req.get("user-agent");
  return userAgent ? userAgent.slice(0, 500) : null;
}

function getRequestBody(req: Request): Record<string, unknown> | null {
  const body = req.body;
  if (body === null || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authenticated user not found." });
    return res.json({ success: true, profile: await getApplicantProfile(userId) });
  } catch (error) {
    console.error("GET /api/profile ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch applicant profile." });
  }
}

export async function getMyProfilePhoto(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authenticated user not found." });

    const photo = await getProfilePhoto(userId);
    if (!photo) return res.status(404).json({ success: false, message: "Profile photo not found." });

    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.type(photo.contentType);
    return res.send(photo.buffer);
  } catch (error) {
    console.error("GET /api/profile/photo ERROR:", error);
    return res.status(404).json({ success: false, message: "Unable to load profile photo." });
  }
}

export async function getUserProfile(req: Request, res: Response) {
  try {
    const numericUserId = Number(req.params.userId);
    if (!Number.isSafeInteger(numericUserId) || numericUserId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid User ID." });
    }
    return res.json({ success: true, profile: await getApplicantProfile(numericUserId) });
  } catch (error) {
    console.error("GET /api/profile/:userId ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch applicant profile." });
  }
}

export async function updateMyProfile(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authenticated user not found." });

    let body = getRequestBody(req);
    if (!body) return res.status(400).json({ success: false, message: "Invalid profile data." });

    /*
     * PIN code is validated again on the backend so an API client cannot
     * submit an arbitrary City/District or State for a valid PIN.
     * The backend postal lookup is authoritative for this address mapping.
     */
    if (body.pincode !== undefined && body.pincode !== null && String(body.pincode).trim() !== "") {
      const pincodeDetails = await getPincodeDetails(String(body.pincode));
      const submittedDistrict = String(body.city || "").trim();
      const submittedState = String(body.state || "").trim();

      if (
        submittedDistrict.toLowerCase() !== pincodeDetails.district.toLowerCase() ||
        submittedState.toLowerCase() !== pincodeDetails.state.toLowerCase()
      ) {
        return res.status(400).json({
          success: false,
          message: "City / District and State must match the selected PIN code.",
        });
      }

      body = {
        ...body,
        pincode: pincodeDetails.pincode,
        city: pincodeDetails.district,
        state: pincodeDetails.state,
      };
    }

    const profile = await saveApplicantProfile(userId, body, userId, {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return res.json({ success: true, message: "Applicant profile updated successfully.", profile });
  } catch (error) {
    console.error("PUT /api/profile ERROR:", error);
    return res.status(400).json({ success: false, message: getErrorMessage(error, "Unable to update applicant profile.") });
  }
}

export async function uploadProfilePhoto(req: Request, res: Response) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authenticated user not found." });

    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "Profile photo file is required." });

    const profile = await saveProfilePhoto(userId, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    }, {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return res.json({ success: true, message: "Profile photo updated successfully.", profile });
  } catch (error) {
    console.error("POST /api/profile/photo ERROR:", error);
    return res.status(400).json({ success: false, message: getErrorMessage(error, "Unable to update profile photo.") });
  }
}
