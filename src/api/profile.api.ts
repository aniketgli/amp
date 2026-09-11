import { apiRequest } from "./apiClient";

import type {
  ApplicantProfile,
  ProfileBank,
  ProfileBatch,
  ProfileBatchSeries,
  ProfileBatchSeriesType,
  ProfileEmploymentTypeMaster,
  ProfileOfficer,
  ProfileOrgUnit,
  ProfileOrgUnitType,
} from "../types/profile";

/* ============================================================
   BACKWARD-COMPATIBLE TYPE EXPORTS
   ------------------------------------------------------------
   Existing profile pages still import these domain types from
   profile.api.ts. Re-exporting them keeps those consumers
   working while the domain types live in src/types/profile.ts.
   ============================================================ */

export type {
  ApplicantProfile,
  ProfileBank,
  ProfileBatch,
  ProfileBatchSeriesType,
  ProfileEmploymentType,
  ProfileEmploymentTypeMaster,
  ProfileOfficer,
  ProfileOrgUnit,
  ProfileOrgUnitType,
} from "../types/profile";

/* ============================================================
   API RESPONSE TYPES
   ============================================================ */

interface ProfileResponse {
  success: boolean;
  message?: string;
  profile?: ApplicantProfile;
}

interface MasterResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/* ============================================================
   PROFILE
   ============================================================ */

/**
 * Get the authenticated user's profile.
 *
 * Authentication is handled by the HttpOnly session cookie
 * through apiRequest().
 */
export async function getMyProfile(): Promise<ApplicantProfile | null> {
  const response = await apiRequest<ProfileResponse>("/api/profile", {
    method: "GET",
  });

  return response.profile ?? null;
}

/**
 * Save the authenticated user's profile.
 *
 * Backend remains the source of truth and performs:
 * - validation
 * - authorization
 * - employment-specific validation
 * - master-data validation
 * - immutable identity enforcement
 * - audit/history recording
 */
export async function updateMyProfile(
  profile: Record<string, unknown>,
): Promise<ApplicantProfile> {
  const response = await apiRequest<ProfileResponse>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });

  if (!response.profile) {
    throw new Error(
      response.message || "Profile update did not return the saved profile.",
    );
  }

  return response.profile;
}

/* ============================================================
   EMPLOYMENT TYPES
   ============================================================ */

export async function getEmploymentTypes(): Promise<
  ProfileEmploymentTypeMaster[]
> {
  const response = await apiRequest<
    MasterResponse<ProfileEmploymentTypeMaster[]>
  >("/api/profile/masters/employment-types", {
    method: "GET",
  });

  return response.data ?? [];
}

/* ============================================================
   ORGANIZATION UNITS
   ============================================================ */

/**
 * Get active Department / Cell / Project masters.
 *
 * Backend contract:
 *   ?types=department,cell,project
 *
 * Organization names are never hardcoded here.
 */
export async function getOrgUnits(
  types?: ProfileOrgUnitType[],
): Promise<ProfileOrgUnit[]> {
  const endpoint =
    types && types.length > 0
      ? `/api/profile/masters/org-units?types=${encodeURIComponent(
          types.join(","),
        )}`
      : "/api/profile/masters/org-units";

  const response = await apiRequest<MasterResponse<ProfileOrgUnit[]>>(
    endpoint,
    {
      method: "GET",
    },
  );

  return response.data ?? [];
}

/* ============================================================
   BANKS
   ============================================================ */

export async function getBanks(): Promise<ProfileBank[]> {
  const response = await apiRequest<MasterResponse<ProfileBank[]>>(
    "/api/profile/masters/banks",
    {
      method: "GET",
    },
  );

  return response.data ?? [];
}

/* ============================================================
   BATCH SERIES
   ============================================================ */

export async function getBatchSeries(
  seriesType?: ProfileBatchSeriesType,
): Promise<ProfileBatchSeries[]> {
  const endpoint = seriesType
    ? `/api/profile/masters/batch-series?seriesType=${encodeURIComponent(
        seriesType,
      )}`
    : "/api/profile/masters/batch-series";

  const response = await apiRequest<MasterResponse<ProfileBatchSeries[]>>(
    endpoint,
    {
      method: "GET",
    },
  );

  return response.data ?? [];
}

/* ============================================================
   BATCHES
   ============================================================ */

export async function getBatches(
  seriesType?: ProfileBatchSeriesType,
): Promise<ProfileBatch[]> {
  const endpoint = seriesType
    ? `/api/profile/masters/batches?seriesType=${encodeURIComponent(
        seriesType,
      )}`
    : "/api/profile/masters/batches";

  const response = await apiRequest<MasterResponse<ProfileBatch[]>>(endpoint, {
    method: "GET",
  });

  return response.data ?? [];
}

/* ============================================================
   OFFICERS / MANAGERS / PI
   ============================================================ */

export async function getProfileOfficers(): Promise<ProfileOfficer[]> {
  const response = await apiRequest<MasterResponse<ProfileOfficer[]>>(
    "/api/profile/masters/officers",
    {
      method: "GET",
    },
  );

  return response.data ?? [];
}

/* ============================================================
   PROFILE PHOTO
   ============================================================ */

/**
 * Upload or replace the authenticated user's profile photo.
 *
 * Authentication is handled by the HttpOnly session cookie.
 * The browser must NOT send a user ID or token.
 */
export async function uploadProfilePhoto(
  file: File,
): Promise<ApplicantProfile> {
  if (!(file instanceof File)) {
    throw new Error("A valid profile photo file is required.");
  }

  const formData = new FormData();

  formData.append("photo", file);

  /*
   * Do not manually set Content-Type here.
   *
   * The browser automatically generates the correct
   * multipart/form-data boundary.
   */
  const response = await apiRequest<ProfileResponse>("/api/profile/photo", {
    method: "POST",
    body: formData,
  });

  if (!response.profile) {
    throw new Error(
      response.message ||
        "Profile photo upload did not return the saved profile.",
    );
  }

  return response.profile;
}

/**
 * Authenticated profile photo endpoint.
 *
 * This is intentionally a relative URL so the browser sends
 * the existing HttpOnly authentication cookie.
 */
export function getProfilePhotoUrl(): string {
  return "/api/profile/photo";
}
