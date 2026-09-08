import { apiRequest } from "./apiClient";

function encodeRequisitionId(
  requisitionId: string,
): string {
  return encodeURIComponent(
    String(requisitionId).trim(),
  );
}

export type WorkflowAction =
  | "approve"
  | "reject"
  | "provision"
  | "deactivate";

export interface WorkflowActionInput {
  action: WorkflowAction;
  comments?: string | null;

  labFacilities?: Array<{
    facilityId: string;
    facilityName: string;
    nodalApprovalStatus:
      | "pending"
      | "approved"
      | "rejected";
    remarks?: string | null;
    reviewedById?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    purposeEquipment?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
    hasBiometricId?: boolean;
    biometricIdNumber?: string | null;
    assignedLabPassId?: string | null;
    nodalOfficerName?: string | null;
    actionDate?: string | null;
  }>;

  provisionedEmail?: string | null;
  provisionedMac?: string | null;
  provisionedHrmsId?: string | null;
  provisionedBiometricId?: string | null;
}

export interface WorkflowActionResponse {
  success: boolean;
  message: string;
  result: {
    requisitionId: string;
    previousStatus: string;
    status: string;
    action: WorkflowAction;
  };
}

export async function executeWorkflowAction(
  requisitionId: string,
  input: WorkflowActionInput,
): Promise<WorkflowActionResponse> {
  return apiRequest<WorkflowActionResponse>(
    `/api/requisitions/${encodeRequisitionId(requisitionId)}/actions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
