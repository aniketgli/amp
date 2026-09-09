import type { Request, Response } from "express";
import {
  getApplicantProfile,
  saveApplicantProfile,
} from "../services/profile.service";

export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

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

export async function getUserProfile(req: Request, res: Response) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const profile = await getApplicantProfile(userId);

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

export async function updateMyProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    const profile = await saveApplicantProfile(userId, req.body || {});

    return res.json({
      success: true,
      message: "Applicant profile updated successfully.",
      profile,
    });
  } catch (error: any) {
    console.error("PUT /api/profile ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error?.message || "Unable to update applicant profile.",
    });
  }
}
