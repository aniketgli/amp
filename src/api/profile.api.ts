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
   RESPONSE TYPES
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

interface PincodeResponse {
  success: boolean;
  message?: string;
  data?: {
    pincode: string;
    district: string;
    state: string;
  };
}

/* ============================================================
   ADMIN PROFILE MASTER TYPES
   ============================================================ */

export interface AdminProfileOrgUnit {
  id: number;
  unitType: ProfileOrgUnitType;
  unitName: string;
  description: string | null;
  status: "active" | "inactive";
}

export interface AdminProfileBank {
  id: number;
  bankName: string;
  bankCode: string | null;
  status: "active" | "inactive";
}

export interface AdminProfileBatch {
  id: number;
  seriesId: number;
  seriesType: ProfileBatchSeriesType;
  seriesName: string;
  batchNumber: number;
  batchLabel: string;
  startYear: number;
  endYear: number;
  status: "active" | "inactive";
}

export interface ProfileOrgUnitAdminPayload {
  unitType: ProfileOrgUnitType;
  unitName: string;
  description?: string | null;
}

export interface ProfileBankAdminPayload {
  bankName: string;
  bankCode?: string | null;
}

export interface ProfileBatchAdminPayload {
  seriesId: number;
  batchNumber: number;
  batchLabel: string;
  startYear: number;
  endYear: number;
}

/* ============================================================
   PROFILE
   ============================================================ */

export async function getMyProfile(): Promise<ApplicantProfile | null> {
  const response = await apiRequest<ProfileResponse>("/api/profile", {
    method: "GET",
  });

  return response.profile ?? null;
}

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
 * Normal profile API.
 *
 * Returns active organization units only.
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

/**
 * Administrator API.
 *
 * Returns all organization units, including inactive records.
 */
export async function getAdminProfileOrgUnits(): Promise<
  AdminProfileOrgUnit[]
> {
  const response = await apiRequest<MasterResponse<AdminProfileOrgUnit[]>>(
    "/api/admin/profile-masters/org-units",
    {
      method: "GET",
    },
  );

  return response.data ?? [];
}

export async function createProfileOrgUnit(
  payload: ProfileOrgUnitAdminPayload,
): Promise<AdminProfileOrgUnit> {
  const response = await apiRequest<MasterResponse<AdminProfileOrgUnit>>(
    "/api/admin/profile-masters/org-units",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if (!response.data) {
    throw new Error(
      response.message || "Organization unit could not be created.",
    );
  }

  return response.data;
}

export async function updateProfileOrgUnit(
  id: number,
  payload: ProfileOrgUnitAdminPayload,
): Promise<AdminProfileOrgUnit> {
  const response = await apiRequest<MasterResponse<AdminProfileOrgUnit>>(
    `/api/admin/profile-masters/org-units/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  if (!response.data) {
    throw new Error(
      response.message || "Organization unit could not be updated.",
    );
  }

  return response.data;
}

export async function updateProfileOrgUnitStatus(
  id: number,
  status: "active" | "inactive",
): Promise<{ id: number; status: "active" | "inactive" }> {
  const response = await apiRequest<
    MasterResponse<{ id: number; status: "active" | "inactive" }>
  >(`/api/admin/profile-masters/org-units/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  if (!response.data) {
    throw new Error(
      response.message || "Organization unit status could not be updated.",
    );
  }

  return response.data;
}

/* ============================================================
   BANKS
   ============================================================ */

/**
 * Normal profile API.
 *
 * Returns active banks only.
 */
export async function getBanks(): Promise<ProfileBank[]> {
  const response = await apiRequest<MasterResponse<ProfileBank[]>>(
    "/api/profile/masters/banks",
    {
      method: "GET",
    },
  );

  return response.data ?? [];
}

/**
 * Administrator API.
 *
 * Returns all banks, including inactive records.
 */
export async function getAdminProfileBanks(): Promise<AdminProfileBank[]> {
  const response = await apiRequest<MasterResponse<AdminProfileBank[]>>(
    "/api/admin/profile-masters/banks",
    {
      method: "GET",
    },
  );

  return response.data ?? [];
}

export async function createProfileBank(
  payload: ProfileBankAdminPayload,
): Promise<AdminProfileBank> {
  const response = await apiRequest<MasterResponse<AdminProfileBank>>(
    "/api/admin/profile-masters/banks",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if (!response.data) {
    throw new Error(response.message || "Bank could not be created.");
  }

  return response.data;
}

export async function updateProfileBank(
  id: number,
  payload: ProfileBankAdminPayload,
): Promise<AdminProfileBank> {
  const response = await apiRequest<MasterResponse<AdminProfileBank>>(
    `/api/admin/profile-masters/banks/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  if (!response.data) {
    throw new Error(response.message || "Bank could not be updated.");
  }

  return response.data;
}

export async function updateProfileBankStatus(
  id: number,
  status: "active" | "inactive",
): Promise<{ id: number; status: "active" | "inactive" }> {
  const response = await apiRequest<
    MasterResponse<{ id: number; status: "active" | "inactive" }>
  >(`/api/admin/profile-masters/banks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  if (!response.data) {
    throw new Error(response.message || "Bank status could not be updated.");
  }

  return response.data;
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

/**
 * Normal profile API.
 *
 * Returns active batches only.
 */
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

/**
 * Administrator API.
 *
 * Returns all batches, including inactive records.
 */
export async function getAdminProfileBatches(): Promise<AdminProfileBatch[]> {
  const response = await apiRequest<MasterResponse<AdminProfileBatch[]>>(
    "/api/admin/profile-masters/batches",
    {
      method: "GET",
    },
  );

  return response.data ?? [];
}

export async function createProfileBatch(
  payload: ProfileBatchAdminPayload,
): Promise<AdminProfileBatch> {
  const response = await apiRequest<MasterResponse<AdminProfileBatch>>(
    "/api/admin/profile-masters/batches",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if (!response.data) {
    throw new Error(response.message || "Batch could not be created.");
  }

  return response.data;
}

export async function updateProfileBatch(
  id: number,
  payload: ProfileBatchAdminPayload,
): Promise<AdminProfileBatch> {
  const response = await apiRequest<MasterResponse<AdminProfileBatch>>(
    `/api/admin/profile-masters/batches/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  if (!response.data) {
    throw new Error(response.message || "Batch could not be updated.");
  }

  return response.data;
}

export async function updateProfileBatchStatus(
  id: number,
  status: "active" | "inactive",
): Promise<{ id: number; status: "active" | "inactive" }> {
  const response = await apiRequest<
    MasterResponse<{ id: number; status: "active" | "inactive" }>
  >(`/api/admin/profile-masters/batches/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  if (!response.data) {
    throw new Error(response.message || "Batch status could not be updated.");
  }

  return response.data;
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
   PIN CODE LOOKUP
   ============================================================ */

export async function getPincodeDetails(
  pincode: string,
): Promise<{ pincode: string; district: string; state: string }> {
  const response = await apiRequest<PincodeResponse>(
    `/api/profile/pincode/${encodeURIComponent(pincode)}`,
    {
      method: "GET",
    },
  );

  if (!response.data) {
    throw new Error(response.message || "PIN code not found.");
  }

  return response.data;
}

/* ============================================================
   PROFILE PHOTO
   ============================================================ */

export async function uploadProfilePhoto(
  file: File,
): Promise<ApplicantProfile> {
  if (!(file instanceof File)) {
    throw new Error("A valid profile photo file is required.");
  }

  const formData = new FormData();
  formData.append("photo", file);

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

export function getProfilePhotoUrl(): string {
  return "/api/profile/photo";
}
