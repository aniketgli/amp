import { db } from "../db/connection";

export type WorkflowActionType =
  | "SUBMIT"
  | "PI_APPROVE"
  | "PI_REJECT"
  | "LAB_APPROVE"
  | "LAB_REJECT"
  | "SECTION_HEAD_APPROVE"
  | "SECTION_HEAD_REJECT"
  | "TECH_PROVISION"
  | "REJECT"
  | "OVERRIDE";

export interface WorkflowAuditEntry {
  requisitionId: string;
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  actionType: WorkflowActionType;
  stageFrom?: string | null;
  stageTo?: string | null;
  remarks?: string | null;
  ipAddress?: string;
}

export async function insertWorkflowAudit(
  entry: WorkflowAuditEntry,
) {
  const [result]: any = await db.query(
    `
    INSERT INTO workflow_audit_logs (
      requisition_id,
      actor_id,
      actor_name,
      actor_role,
      action_type,
      stage_from,
      stage_to,
      remarks,
      ip_address
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      entry.requisitionId,
      entry.actorId || null,
      entry.actorName,
      entry.actorRole,
      entry.actionType,
      entry.stageFrom || null,
      entry.stageTo || null,
      entry.remarks || null,
      entry.ipAddress || "127.0.0.1",
    ],
  );

  return result?.insertId || null;
}

export async function getWorkflowAudit(
  requisitionId: string,
) {
  const [rows]: any = await db.query(
    `
    SELECT
      id,
      requisition_id,
      actor_id,
      actor_name,
      actor_role,
      action_type,
      stage_from,
      stage_to,
      remarks,
      ip_address,
      created_at
    FROM workflow_audit_logs
    WHERE requisition_id = ?
    ORDER BY created_at ASC, id ASC
    `,
    [requisitionId],
  );

  return rows || [];
}
