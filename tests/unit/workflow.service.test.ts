import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  getRequisitionById: vi.fn(),
  getSelectedLabFacilities: vi.fn(),
  updateRequisitionMaster: vi.fn(),
  updateWorkflowState: vi.fn(),
  updateProvisioningFields: vi.fn(),
  replaceLabFacilities: vi.fn(),
}));

const auditMocks = vi.hoisted(() => ({
  insertWorkflowAudit: vi.fn(),
}));

vi.mock(
  "../../server/repositories/requisition.repository",
  () => repositoryMocks,
);
vi.mock("../../server/repositories/workflow.repository", () => auditMocks);

import { executeWorkflowAction } from "../../server/services/workflow.service";

describe("executeWorkflowAction - workflow authorization and transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    repositoryMocks.updateRequisitionMaster.mockResolvedValue(undefined);
    repositoryMocks.updateWorkflowState.mockResolvedValue(undefined);
    repositoryMocks.updateProvisioningFields.mockResolvedValue(undefined);
    repositoryMocks.replaceLabFacilities.mockResolvedValue(undefined);
    repositoryMocks.getSelectedLabFacilities.mockResolvedValue([]);
    auditMocks.insertWorkflowAudit.mockResolvedValue(undefined);
  });

  it("rejects an unauthorized applicant trying to approve", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0101",
      status: "submitted_pending_pi",
      requisition_type: "IT_HRMS",
    });

    await expect(
      executeWorkflowAction({
        requisitionId: "WII/2026/0101",
        action: "approve",
        actorId: "101",
        actorName: "Applicant",
        actorRole: "applicant",
      }),
    ).rejects.toThrow("You are not authorized to approve this requisition.");
  });

  it("allows supervisor approval and forwards IT-only request to section head", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0101",
      status: "submitted_pending_pi",
      requisition_type: "IT_HRMS",
    });

    const result = await executeWorkflowAction({
      requisitionId: "WII/2026/0101",
      action: "approve",
      actorId: "101",
      actorName: "Supervisor",
      actorRole: "supervisor",
    });

    expect(result.previousStatus).toBe("submitted_pending_pi");
    expect(result.status).toBe("pending_section_head");
    expect(result.action).toBe("approve");

    expect(repositoryMocks.updateRequisitionMaster).toHaveBeenCalledWith(
      "WII/2026/0101",
      {
        status: "pending_section_head",
        remarks: null,
      },
    );

    expect(auditMocks.insertWorkflowAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        requisitionId: "WII/2026/0101",
        actorId: "101",
        actorRole: "supervisor",
        actionType: "PI_APPROVE",
        stageFrom: "submitted_pending_pi",
        stageTo: "pending_section_head",
      }),
    );
  });

  it("routes a lab requisition from supervisor to lab review", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0102",
      status: "submitted_pending_pi",
      requisition_type: "LAB_FACILITY",
    });

    repositoryMocks.getSelectedLabFacilities.mockResolvedValue([
      { facility_id: "FAC-01" },
    ]);

    const result = await executeWorkflowAction({
      requisitionId: "WII/2026/0102",
      action: "approve",
      actorId: "101",
      actorName: "Supervisor",
      actorRole: "supervisor",
    });

    expect(result.status).toBe("in_lab_review");
  });

  it("allows lab nodal approval only at lab review stage", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0103",
      status: "in_lab_review",
      requisition_type: "LAB_FACILITY",
    });

    const result = await executeWorkflowAction({
      requisitionId: "WII/2026/0103",
      action: "approve",
      actorId: "202",
      actorName: "Lab Nodal",
      actorRole: "lab_nodal",
      labFacilities: [
        {
          facilityId: "FAC-01",
          facilityName: "Research Lab",
          nodalApprovalStatus: "approved",
        },
      ],
    });

    expect(result.status).toBe("pending_section_head");

    expect(repositoryMocks.replaceLabFacilities).toHaveBeenCalledWith(
      "WII/2026/0103",
      expect.arrayContaining([
        expect.objectContaining({
          facilityId: "FAC-01",
          reviewedById: "202",
          reviewedBy: "Lab Nodal",
        }),
      ]),
    );
  });

  it("rejects lab nodal action at the wrong stage", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0104",
      status: "submitted_pending_pi",
      requisition_type: "LAB_FACILITY",
    });

    await expect(
      executeWorkflowAction({
        requisitionId: "WII/2026/0104",
        action: "approve",
        actorId: "202",
        actorName: "Lab Nodal",
        actorRole: "lab_nodal",
      }),
    ).rejects.toThrow(
      'Workflow action is not allowed for role "lab_nodal" at stage "submitted_pending_pi".',
    );
  });

  it("allows section head approval and forwards IT request to technical verification", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0105",
      status: "pending_section_head",
      requisition_type: "IT_HRMS",
    });

    const result = await executeWorkflowAction({
      requisitionId: "WII/2026/0105",
      action: "approve",
      actorId: "303",
      actorName: "Section Head",
      actorRole: "section_head",
    });

    expect(result.status).toBe("in_tech_verification");

    expect(repositoryMocks.updateWorkflowState).toHaveBeenCalledWith(
      "WII/2026/0105",
      expect.objectContaining({
        section_head_status: "approved",
        section_head_officer_id: "303",
        section_head_officer_name: "Section Head",
      }),
    );
  });

  it("allows IT officer approval at technical verification", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0106",
      status: "in_tech_verification",
      requisition_type: "IT_HRMS",
    });

    const result = await executeWorkflowAction({
      requisitionId: "WII/2026/0106",
      action: "approve",
      actorId: "404",
      actorName: "IT Officer",
      actorRole: "it_officer",
    });

    expect(result.status).toBe("approved_provisioned");

    expect(repositoryMocks.updateWorkflowState).toHaveBeenCalledWith(
      "WII/2026/0106",
      expect.objectContaining({
        email_net_status: "verified",
        email_net_officer_id: "404",
        email_net_officer_name: "IT Officer",
      }),
    );
  });

  it("allows HRMS officer provisioning data to be stored", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0107",
      status: "in_tech_verification",
      requisition_type: "COMBINED",
    });

    const result = await executeWorkflowAction({
      requisitionId: "WII/2026/0107",
      action: "provision",
      actorId: "405",
      actorName: "HRMS Officer",
      actorRole: "hrms_officer",
      provisionedHrmsId: "HRMS-7788",
      provisionedBiometricId: "BIO-7788",
    });

    expect(result.status).toBe("approved_provisioned");

    expect(repositoryMocks.updateProvisioningFields).toHaveBeenCalledWith(
      "WII/2026/0107",
      {
        provisionedEmail: undefined,
        provisionedMac: undefined,
        provisionedHrmsId: "HRMS-7788",
        provisionedBiometricId: "BIO-7788",
      },
    );
  });

  it("prevents non-admin users from deactivating access", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0108",
      status: "approved_provisioned",
      requisition_type: "IT_HRMS",
    });

    await expect(
      executeWorkflowAction({
        requisitionId: "WII/2026/0108",
        action: "deactivate",
        actorId: "404",
        actorName: "IT Officer",
        actorRole: "it_officer",
      }),
    ).rejects.toThrow("Only administrators can deactivate access.");
  });

  it("allows admin override deactivation", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue({
      id: "WII/2026/0109",
      status: "approved_provisioned",
      requisition_type: "IT_HRMS",
    });

    const result = await executeWorkflowAction({
      requisitionId: "WII/2026/0109",
      action: "deactivate",
      actorId: "1",
      actorName: "Administrator",
      actorRole: "admin",
      comments: "Access no longer required.",
    });

    expect(result.previousStatus).toBe("approved_provisioned");
    expect(result.status).toBe("deactivated");

    expect(auditMocks.insertWorkflowAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorRole: "admin",
        actionType: "OVERRIDE",
        stageFrom: "approved_provisioned",
        stageTo: "deactivated",
        remarks: "Access no longer required.",
      }),
    );
  });

  it("rejects workflow actions when requisition does not exist", async () => {
    repositoryMocks.getRequisitionById.mockResolvedValue(null);

    await expect(
      executeWorkflowAction({
        requisitionId: "WII/2026/9999",
        action: "approve",
        actorId: "101",
        actorName: "Supervisor",
        actorRole: "supervisor",
      }),
    ).rejects.toThrow("Requisition not found.");
  });
});
