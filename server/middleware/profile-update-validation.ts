import type { NextFunction, Request, Response } from "express";

import { getPincodeDetails } from "../services/pincode.service";

const ALLOWED_SALUTATIONS = new Set(["Dr.", "Mr.", "Ms.", "Prof."]);
const ALLOWED_GENDERS = new Set(["Female", "Male", "Other"]);
const ALLOWED_BLOOD_GROUPS = new Set([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);

function requiredString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  const normalized = value === undefined || value === null ? "" : String(value).trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function validateDate(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must be a valid date.`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${field} must be a valid date.`);
  }
}

function validateEmail(value: string): void {
  if (value.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Enter a valid Personal Email.");
  }
}

function validateMobile(value: string): void {
  if (!/^[0-9]{10,15}$/.test(value)) {
    throw new Error("Enter a valid mobile number.");
  }
}

/**
 * Common profile validation which must run before the profile service.
 *
 * The profile service remains the authoritative business-rule validator.
 * This middleware adds request-shape validation, prevents photo-path
 * manipulation through the normal profile endpoint, and verifies that
 * the city/state pair actually belongs to the supplied Indian PIN code.
 */
export async function validateProfileUpdate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      throw new Error("Invalid profile data.");
    }

    const body = req.body as Record<string, unknown>;

    /* Profile photos are controlled exclusively by /api/profile/photo. */
    if (Object.prototype.hasOwnProperty.call(body, "profilePhotoPath")) {
      throw new Error("Profile photo can only be changed using the profile photo action.");
    }

    const salutation = requiredString(body, "Salutation");
    const employmentType = requiredString(body, "Employment Type");
    const gender = requiredString(body, "Gender");
    const bloodGroup = requiredString(body, "Blood Group");
    const address = requiredString(body, "Address");
    const city = requiredString(body, "City / District");
    const state = requiredString(body, "State");
    const pincode = requiredString(body, "Pincode");
    const dateOfBirth = requiredString(body, "Date of Birth");
    const personalEmail = requiredString(body, "Personal Email");
    const mobileNo = requiredString(body, "Mobile Number");

    if (!ALLOWED_SALUTATIONS.has(salutation)) {
      throw new Error("Selected Salutation is invalid.");
    }

    if (!ALLOWED_GENDERS.has(gender)) {
      throw new Error("Selected Gender is invalid.");
    }

    if (!ALLOWED_BLOOD_GROUPS.has(bloodGroup)) {
      throw new Error("Selected Blood Group is invalid.");
    }

    if (address.length > 1000) {
      throw new Error("Address must not exceed 1000 characters.");
    }

    if (city.length > 150 || state.length > 150) {
      throw new Error("City / District and State must not exceed 150 characters.");
    }

    if (!/^\d{6}$/.test(pincode)) {
      throw new Error("Enter a valid 6-digit PIN code.");
    }

    validateDate(dateOfBirth, "Date of Birth");
    validateEmail(personalEmail);
    validateMobile(mobileNo);

    /*
     * PIN is authoritative for district/state. Do not trust arbitrary
     * city/state values sent by a modified client.
     */
    const pincodeDetails = await getPincodeDetails(pincode);

    if (pincodeDetails.district.toLowerCase() !== city.toLowerCase()) {
      throw new Error("City / District does not match the entered PIN code.");
    }

    if (pincodeDetails.state.toLowerCase() !== state.toLowerCase()) {
      throw new Error("State does not match the entered PIN code.");
    }

    return next();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid profile data.";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
