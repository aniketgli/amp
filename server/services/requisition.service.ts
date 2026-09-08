import {
  createRequisition,
  generateNextRequisitionId,
  getAllRequisitions,
  getRequisitionById,
  updateRequisitionMaster,
  initializeWorkflowState,
  upsertITHrmsDetails,
  replaceLabFacilities,
} from "../repositories/requisition.repository";

import {
  insertWorkflowAudit,
} from "../repositories/workflow.repository";

import {
  getUserById,
} from "../repositories/user.repository";

export type RequisitionRole =
  | "applicant"
  | "user"
  | "supervisor"
  | "lab_nodal"
  | "assoc_lab_nodal"
  | "section_head"
  | "it_officer"
  | "hrms_officer"
  | "admin"
  | "super_admin";

const ADMIN_ROLES: RequisitionRole[] = [
  "admin",
  "super_admin",
];

const ACTIVE_STATUSES = [
  "draft",
  "submitted_pending_pi",
  "pi_approved",
  "in_lab_review",
  "pending_section_head",
  "in_tech_verification",
  "approved_provisioned",
  "rejected",
  "deactivated",
];

export interface CreateRequisitionServiceInput {
  requisitionType:
    | "IT_HRMS"
    | "LAB_FACILITY"
    | "COMBINED";

  requisitionMode?: "new" | "renewal";
  renewalReason?: string | null;
  remarks?: string | null;

  itHrmsDetails?: {
    requisitionMode?: "new" | "renewal";
    renewalReason?: string;
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
    nodalApprovalStatus?: "pending" | "approved" | "rejected";
    remarks?: string | null;
    reviewedById?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
  }>;
}

export function normalizeRole(
  role: unknown,
): RequisitionRole {
  const value = String(role || "").trim().toLowerCase();

  if (value === "user") {
    return "applicant";
  }

  return value as RequisitionRole;
}

/**
 * Server-side visibility rule.
 *
 * This mirrors the application's existing workflow visibility model,
 * but is enforced on the backend so the frontend cannot bypass it.
 */
export function canViewRequisition(
  requisition: any,
  actorId: string,
  actorRole: RequisitionRole,
): boolean {
  if (!requisition) {
    return false;
  }

  // Administrators can see everything.
  if (ADMIN_ROLES.includes(actorRole)) {
    return true;
  }

  // Applicant/User can only see their own requisitions.
  if (actorRole === "applicant") {
    return String(requisition.applicant_id) === String(actorId);
  }

  const status = String(requisition.status || "");

  // Supervisor / PI
  if (actorRole === "supervisor") {
    return (
      status !== "draft" &&
      status !== "deactivated"
    );
  }

  // Lab Nodal / Associate Nodal
  if (
    actorRole === "lab_nodal" ||
    actorRole === "assoc_lab_nodal"
  ) {
    const hasLab =
      requisition.requisition_type === "LAB_FACILITY" ||
      requisition.requisition_type === "COMBINED";

    if (!hasLab) {
      return false;
    }

    return [
      "in_lab_review",
      "pending_section_head",
      "in_tech_verification",
      "approved_provisioned",
      "rejected",
    ].includes(status);
  }

  // Section Head
  if (actorRole === "section_head") {
    return [
      "pending_section_head",
      "in_tech_verification",
      "approved_provisioned",
      "rejected",
    ].includes(status);
  }

  // IT Officer / HRMS Officer
  if (
    actorRole === "it_officer" ||
    actorRole === "hrms_officer"
  ) {
    const hasIT =
      requisition.requisition_type === "IT_HRMS" ||
      requisition.requisition_type === "COMBINED";

    if (!hasIT) {
      return false;
    }

    return [
      "in_tech_verification",
      "approved_provisioned",
      "rejected",
    ].includes(status);
  }

  return false;
}

export async function listRequisitionsForActor(
  actorId: string,
  actorRole: RequisitionRole,
) {
  const all = await getAllRequisitions();

  return all.filter((requisition: any) =>
    canViewRequisition(
      requisition,
      actorId,
      actorRole,
    ),
  );
}

export async function findRequisitionForActor(
  requisitionId: string,
  actorId: string,
  actorRole: RequisitionRole,
) {
  if (!requisitionId || !requisitionId.trim()) {
    throw new Error("Requisition ID is required.");
  }

  const requisition = await getRequisitionById(
    requisitionId.trim(),
  );

  if (!requisition) {
    return null;
  }

  if (
    !canViewRequisition(
      requisition,
      actorId,
      actorRole,
    )
  ) {
    return null;
  }

  return requisition;
}

export async function createNewRequisition(
  actorId: string,
  actorRole: RequisitionRole,
  input: CreateRequisitionServiceInput,
) {
  // Only Applicant/User can create access requests.
  if (actorRole !== "applicant" && !ADMIN_ROLES.includes(actorRole)) {
    const error: any = new Error(
      "Only User/Applicant accounts can create requisitions.",
    );

    error.statusCode = 403;
    throw error;
  }

  if (!input.requisitionType) {
    throw new Error("Requisition type is required.");
  }

  if (
    input.requisitionType !== "IT_HRMS" &&
    input.requisitionType !== "LAB_FACILITY" &&
    input.requisitionType !== "COMBINED"
  ) {
    throw new Error("Invalid requisition type.");
  }

  const details = input.itHrmsDetails || {};

  const requisitionMode =
    input.requisitionMode ||
    details.requisitionMode ||
    "new";

  const renewalReason =
    input.renewalReason ||
    details.renewalReason ||
    null;

  if (
    requisitionMode === "renewal" &&
    !renewalReason?.trim()
  ) {
    throw new Error(
      "Renewal reason is required for renewal requisitions.",
    );
  }

  // The applicant ID comes ONLY from the authenticated JWT.
  const applicantId = actorId.trim();

  const applicant = await getUserById(
    applicantId,
  );

  if (!applicant) {
    const error: any = new Error(
      "Authenticated user account no longer exists.",
    );

    error.statusCode = 401;
    throw error;
  }

  if (
    Number(applicant.is_activated) !== 1 ||
    String(applicant.status).toLowerCase() !== "active"
  ) {
    const error: any = new Error(
      "User account is inactive.",
    );

    error.statusCode = 403;
    throw error;
  }

  // Generate ID on the server.
  const requisitionId =
    await generateNextRequisitionId();

  await createRequisition({
    id: requisitionId,
    applicantId,
    requisitionType: input.requisitionType,
    status: "submitted_pending_pi",
    requisitionMode,
    renewalReason: renewalReason?.trim() || null,
    remarks: input.remarks?.trim() || null,
  });

  // Initialize current workflow-state row.
  await initializeWorkflowState(requisitionId);

  // Save IT / HRMS details.
  if (
    input.requisitionType === "IT_HRMS" ||
    input.requisitionType === "COMBINED"
  ) {
    await upsertITHrmsDetails(
      requisitionId,
      {
        requestEmail: details.requestEmail,
        requestedEmailPrefix:
          details.requestedEmailPrefix,
        requestedEmailGroups:
          details.requestedEmailGroups,
        requestInternet:
          details.requestInternet,
        deviceType: details.deviceType,
        macAddress: details.macAddress,
        requestHrmsPms:
          details.requestHrmsPms,
        requestBiometric:
          details.requestBiometric,
      },
    );
  }

  // Save selected lab facilities.
  if (
    input.requisitionType === "LAB_FACILITY" ||
    input.requisitionType === "COMBINED"
  ) {
    await replaceLabFacilities(
      requisitionId,
      input.labFacilities || [],
    );
  }

  // Permanent SUBMIT audit record.
  await insertWorkflowAudit({
    requisitionId,
    actorId,
    actorName:
      applicant.full_name || actorId,
    actorRole,
    actionType: "SUBMIT",
    stageFrom: "draft",
    stageTo: "submitted_pending_pi",
    remarks:
      input.remarks?.trim() ||
      "Requisition submitted electronically.",
  });

  return requisitionId;
}

export async function updateExistingRequisition(
  requisitionId: string,
  actorId: string,
  actorRole: RequisitionRole,
  input: {
    status?: string;
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
      provisionedEmail?: string | null;
      provisionedMac?: string | null;
      provisionedHrmsId?: string | null;
      provisionedBiometricId?: string | null;
    };

    labFacilities?: Array<{
      facilityId: string;
      facilityName: string;
      nodalApprovalStatus?: "pending" | "approved" | "rejected";
      remarks?: string | null;
      reviewedById?: string | null;
      reviewedBy?: string | null;
      reviewedAt?: string | null;
    }>;
  },
) {
  const existing = await getRequisitionById(
    requisitionId.trim(),
  );

  if (!existing) {
    return false;
  }

  // Only the applicant owning the requisition or an admin
  // can use this generic update endpoint.
  const isOwner =
    String(existing.applicant_id) ===
    String(actorId);

  if (!isOwner && !ADMIN_ROLES.includes(actorRole)) {
    const error: any = new Error(
      "You are not authorized to update this requisition.",
    );

    error.statusCode = 403;
    throw error;
  }

  // Applicant cannot directly manipulate workflow status.
  // Workflow status changes must happen through /actions.
  const safeStatus =
    ADMIN_ROLES.includes(actorRole)
      ? input.status
      : undefined;

  if (
    input.requisitionMode === "renewal" &&
    input.renewalReason !== undefined &&
    !input.renewalReason?.trim()
  ) {
    throw new Error(
      "Renewal reason is required for renewal requisitions.",
    );
  }

  const updated =
    await updateRequisitionMaster(
      requisitionId.trim(),
      {
        status: safeStatus,
        requisitionMode:
          input.requisitionMode,
        renewalReason:
          input.renewalReason === undefined
            ? undefined
            : input.renewalReason?.trim() || null,
        remarks:
          input.remarks === undefined
            ? undefined
            : input.remarks?.trim() || null,
      },
    );

  if (input.itHrmsDetails) {
    await upsertITHrmsDetails(
      requisitionId.trim(),
      input.itHrmsDetails,
    );
  }

  if (input.labFacilities) {
    await replaceLabFacilities(
      requisitionId.trim(),
      input.labFacilities,
    );
  }

  return updated;
}

