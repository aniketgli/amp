import type { Request, Response } from "express";

import { getPincodeDetails } from "../services/pincode.service";

function getPincodeParam(req: Request): string {
  const value = req.params.pincode;
  return String(value || "").trim();
}

export async function lookupProfilePincode(req: Request, res: Response) {
  try {
    const pincode = getPincodeParam(req);
    const details = await getPincodeDetails(pincode);

    return res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify the PIN code.";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
