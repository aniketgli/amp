import { apiRequest } from "./apiClient";
import type { RequisitionRecord } from "@/types";

function encodeRequisitionId(
  requisitionId: string,
): string {
  return encodeURIComponent(
    String(requisitionId).trim(),
  );
}

export interface RequisitionListResponse {
  success: boolean;
  count: number;
  requisitions: RequisitionRecord[];
}

export interface RequisitionDetailResponse {
  success: boolean;
  requisition: RequisitionRecord;
}

export interface CreateRequisitionApiInput {
  requisitionType:
    | "IT_HRMS"
    | "LAB_FACILITY"
    | "COMBINED";

  requisitionMode?: "new" | "renewal";
  renewalReason?: string | null;
  remarks?: string | null;

  itHrmsDetails?: {
    requestEmail?: boolean;
    requestedEmailPrefix?: string | null;
    requestedEmailGroups?: string[] | null;
    requestInternet?: boolean;
    deviceType?: string | null;
    macAddress?: string | null;
    requestHrmsPms?: boolean;
    requestBiometric?: boolean;
  };

  labFacilities?: Array<{
    facilityId: string;
    facilityName: string;
    purposeEquipment?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
    hasBiometricId?: boolean;
    biometricIdNumber?: string | null;
    assignedLabPassId?: string | null;
    nodalApprovalStatus?:
      | "pending"
      | "approved"
      | "rejected";
    remarks?: string | null;
    reviewedById?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    nodalOfficerName?: string | null;
    actionDate?: string | null;
  }>;
}

export async function getRequisitions(): Promise<RequisitionListResponse> {
  return apiRequest<RequisitionListResponse>(
    "/api/requisitions",
  );
}

export async function getRequisition(
  requisitionId: string,
): Promise<RequisitionDetailResponse> {
  return apiRequest<RequisitionDetailResponse>(
    `/api/requisitions/${encodeRequisitionId(requisitionId)}`,
  );
}

export async function createRequisition(
  input: CreateRequisitionApiInput,
) {
  return apiRequest<{
    success: boolean;
    message: string;
    id: string;
  }>("/api/requisitions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateRequisition(
  requisitionId: string,
  input: Record<string, unknown>,
) {
  return apiRequest<{
    success: boolean;
    message: string;
    id: string;
  }>(
    `/api/requisitions/${encodeRequisitionId(requisitionId)}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}
