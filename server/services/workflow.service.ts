import {
  getRequisitionById,
  getSelectedLabFacilities,
  updateRequisitionMaster,
  updateWorkflowState,
  updateProvisioningFields,
  replaceLabFacilities,
} from "../repositories/requisition.repository";

import {
  insertWorkflowAudit,
} from "../repositories/workflow.repository";

export type WorkflowAction =
  | "approve"
  | "reject"
  | "provision"
  | "deactivate";

export type WorkflowRole =
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

const ADMIN_ROLES: WorkflowRole[] = [
  "admin",
  "super_admin",
];

const VALID_ACTIONS: WorkflowAction[] = [
  "approve",
  "reject",
  "provision",
  "deactivate",
];

function getEffectiveRole(
  role: WorkflowRole,
  currentStatus: string,
): WorkflowRole {
  if (!ADMIN_ROLES.includes(role)) {
    return role;
  }

  switch (currentStatus) {
    case "submitted_pending_pi":
      return "supervisor";

    case "in_lab_review":
      return "lab_nodal";

    case "pending_section_head":
      return "section_head";

    case "in_tech_verification":
      return "it_officer";

    default:
      return "it_officer";
  }
}

function assertRoleCanAct(
  role: WorkflowRole,
  action: WorkflowAction,
) {
  if (!VALID_ACTIONS.includes(action)) {
    throw new Error("Invalid workflow action.");
  }

  if (ADMIN_ROLES.includes(role)) {
    return;
  }

  if (action === "deactivate") {
    throw new Error(
      "Only administrators can deactivate access.",
    );
  }

  if (
    action === "approve" &&
    ![
      "supervisor",
      "lab_nodal",
      "assoc_lab_nodal",
      "section_head",
      "it_officer",
      "hrms_officer",
    ].includes(role)
  ) {
    throw new Error(
      "You are not authorized to approve this requisition.",
    );
  }

  if (
    action === "provision" &&
    ![
      "it_officer",
      "hrms_officer",
    ].includes(role)
  ) {
    throw new Error(
      "You are not authorized to provision this requisition.",
    );
  }

  if (
    action === "reject" &&
    ![
      "supervisor",
      "lab_nodal",
      "assoc_lab_nodal",
      "section_head",
      "it_officer",
      "hrms_officer",
    ].includes(role)
  ) {
    throw new Error(
      "You are not authorized to reject this requisition.",
    );
  }
}

function assertValidStage(
  effectiveRole: WorkflowRole,
  currentStatus: string,
  action: WorkflowAction,
) {
  if (action === "deactivate") {
    return;
  }

  const allowedStatuses: Record<string, string[]> = {
    supervisor: [
      "submitted_pending_pi",
    ],

    lab_nodal: [
      "in_lab_review",
    ],

    assoc_lab_nodal: [
      "in_lab_review",
    ],

    section_head: [
      "pending_section_head",
    ],

    it_officer: [
      "in_tech_verification",
    ],

    hrms_officer: [
      "in_tech_verification",
    ],
  };

  const allowed =
    allowedStatuses[effectiveRole] || [];

  if (!allowed.includes(currentStatus)) {
    throw new Error(
      `Workflow action is not allowed for role "${effectiveRole}" at stage "${currentStatus}".`,
    );
  }
}

function getAuditAction(
  effectiveRole: WorkflowRole,
  action: WorkflowAction,
) {
  if (action === "deactivate") {
    return "OVERRIDE" as const;
  }

  if (action === "reject") {
    switch (effectiveRole) {
      case "supervisor":
        return "PI_REJECT" as const;

      case "lab_nodal":
      case "assoc_lab_nodal":
        return "LAB_REJECT" as const;

      case "section_head":
        return "SECTION_HEAD_REJECT" as const;

      default:
        return "REJECT" as const;
    }
  }

  switch (effectiveRole) {
    case "supervisor":
      return "PI_APPROVE" as const;

    case "lab_nodal":
    case "assoc_lab_nodal":
      return "LAB_APPROVE" as const;

    case "section_head":
      return "SECTION_HEAD_APPROVE" as const;

    case "it_officer":
    case "hrms_officer":
      return "TECH_PROVISION" as const;

    default:
      return "OVERRIDE" as const;
  }
}

async function persistCurrentWorkflowState(input: {
  requisitionId: string;
  effectiveRole: WorkflowRole;
  action: WorkflowAction;
  actorId: string;
  actorName: string;
  comments?: string | null;
}) {
  const now = new Date();

  const status =
    input.action === "reject"
      ? "rejected"
      : input.action === "deactivate"
      ? "deactivated"
      : "approved";

  if (input.effectiveRole === "supervisor") {
    await updateWorkflowState(
      input.requisitionId,
      {
        pi_status: status,
        pi_officer_id: input.actorId,
        pi_officer_name: input.actorName,
        pi_comments: input.comments || null,
        pi_timestamp: now,
        pi_signature: input.actorName,
      },
    );

    return;
  }

  if (
    input.effectiveRole === "lab_nodal" ||
    input.effectiveRole === "assoc_lab_nodal"
  ) {
    // Lab approval/rejection is stored primarily in
    // lab_facility_details. Audit history records the action.
    return;
  }

  if (input.effectiveRole === "section_head") {
    await updateWorkflowState(
      input.requisitionId,
      {
        section_head_status: status,
        section_head_officer_id: input.actorId,
        section_head_officer_name:
          input.actorName,
        section_head_comments:
          input.comments || null,
        section_head_timestamp: now,
        section_head_signature:
          input.actorName,
      },
    );

    return;
  }

  if (
    input.effectiveRole === "it_officer" ||
    input.effectiveRole === "hrms_officer"
  ) {
    const state =
      input.action === "reject"
        ? "rejected"
        : "verified";

    if (
      input.effectiveRole === "it_officer"
    ) {
      await updateWorkflowState(
        input.requisitionId,
        {
          email_net_status: state,
          email_net_officer_id:
            input.actorId,
          email_net_officer_name:
            input.actorName,
          email_net_comments:
            input.comments || null,
          email_net_timestamp: now,
        },
      );
    }

    if (
      input.effectiveRole === "hrms_officer"
    ) {
      await updateWorkflowState(
        input.requisitionId,
        {
          hrms_status: state,
          hrms_officer_id:
            input.actorId,
          hrms_officer_name:
            input.actorName,
          hrms_comments:
            input.comments || null,
          hrms_timestamp: now,
        },
      );
    }
  }
}

export async function executeWorkflowAction(input: {
  requisitionId: string;
  action: WorkflowAction;
  actorId: string;
  actorName: string;
  actorRole: WorkflowRole;
  comments?: string | null;
  ipAddress?: string;

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
}) {
  const requisitionId =
    String(input.requisitionId || "").trim();

  if (!requisitionId) {
    throw new Error(
      "Requisition ID is required.",
    );
  }

  const requisition =
    await getRequisitionById(
      requisitionId,
    );

  if (!requisition) {
    const error: any = new Error(
      "Requisition not found.",
    );
    error.statusCode = 404;
    throw error;
  }

  assertRoleCanAct(
    input.actorRole,
    input.action,
  );

  const effectiveRole =
    getEffectiveRole(
      input.actorRole,
      requisition.status,
    );

  assertValidStage(
    effectiveRole,
    requisition.status,
    input.action,
  );

  const previousStatus =
    requisition.status;

  let nextStatus = previousStatus;

  if (input.action === "deactivate") {
    nextStatus = "deactivated";
  } else if (
    input.action === "reject"
  ) {
    nextStatus = "rejected";
  } else if (
    input.action === "approve"
  ) {
    switch (effectiveRole) {
      case "supervisor": {
        const selectedLabs =
          await getSelectedLabFacilities(
            requisitionId,
          );

        const hasLab =
          requisition.requisition_type ===
            "LAB_FACILITY" ||
          (
            requisition.requisition_type ===
              "COMBINED" &&
            selectedLabs.length > 0
          );

        nextStatus = hasLab
          ? "in_lab_review"
          : "pending_section_head";

        break;
      }

      case "lab_nodal":
      case "assoc_lab_nodal":
        nextStatus = "pending_section_head";
        break;

      case "section_head": {
        const hasIT =
          requisition.requisition_type ===
            "IT_HRMS" ||
          requisition.requisition_type ===
            "COMBINED";

        nextStatus = hasIT
          ? "in_tech_verification"
          : "approved_provisioned";

        break;
      }

      case "it_officer":
      case "hrms_officer":
        nextStatus = "approved_provisioned";
        break;

      default:
        throw new Error(
          "Invalid workflow approval role.",
        );
    }
  } else if (
    input.action === "provision"
  ) {
    nextStatus = "approved_provisioned";
  }

  if (
    (
      effectiveRole === "lab_nodal" ||
      effectiveRole === "assoc_lab_nodal"
    ) &&
    input.labFacilities !== undefined
  ) {
    await replaceLabFacilities(
      requisitionId,
      input.labFacilities.map((lab) => ({
        ...lab,
        reviewedById:
          input.actorId,
        reviewedBy:
          input.actorName,
        reviewedAt:
          new Date().toISOString(),
      })),
    );
  }

  if (
    input.action === "provision" ||
    effectiveRole === "it_officer" ||
    effectiveRole === "hrms_officer"
  ) {
    const hasProvisioningData =
      input.provisionedEmail !== undefined ||
      input.provisionedMac !== undefined ||
      input.provisionedHrmsId !== undefined ||
      input.provisionedBiometricId !== undefined;

    if (hasProvisioningData) {
      await updateProvisioningFields(
        requisitionId,
        {
          provisionedEmail:
            input.provisionedEmail,
          provisionedMac:
            input.provisionedMac,
          provisionedHrmsId:
            input.provisionedHrmsId,
          provisionedBiometricId:
            input.provisionedBiometricId,
        },
      );
    }
  }

  await persistCurrentWorkflowState({
    requisitionId,
    effectiveRole,
    action: input.action,
    actorId: input.actorId,
    actorName: input.actorName,
    comments: input.comments,
  });

  await updateRequisitionMaster(
    requisitionId,
    {
      status: nextStatus,
      remarks:
        input.comments || null,
    },
  );

  await insertWorkflowAudit({
    requisitionId,
    actorId: input.actorId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    actionType: getAuditAction(
      effectiveRole,
      input.action,
    ),
    stageFrom: previousStatus,
    stageTo: nextStatus,
    remarks:
      input.comments || null,
    ipAddress:
      input.ipAddress,
  });

  return {
    requisitionId,
    previousStatus,
    status: nextStatus,
    action: input.action,
  };
}
