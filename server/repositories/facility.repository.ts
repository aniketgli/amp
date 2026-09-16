import { db } from "../db/connection";

export interface CreateFacilityInput { id: string; name: string; dept?: string | null; nodal: string; assocNodal: string; supervisor: string; desc?: string | null; status: string; workflowStages?: unknown[] | null; formConfig?: Record<string, unknown> | null; }
export interface UpdateFacilityInput { id: string; name: string; dept?: string | null; nodal: string; assocNodal: string; supervisor: string; desc?: string | null; status?: string; workflowStages?: unknown[] | null; formConfig?: Record<string, unknown> | null; }

export async function getAllFacilities(): Promise<any[]> {
  try {
    const [rows]: any = await db.query(`SELECT id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status, workflow_stages, form_config, created_at, updated_at FROM facility_masters ORDER BY id`);
    return rows;
  } catch (_) {
    try {
      const [rows]: any = await db.query(`SELECT id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status, form_config, created_at, updated_at FROM facility_masters ORDER BY id`);
      return rows;
    } catch (_) {
      const [rows]: any = await db.query(`SELECT id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status, created_at, updated_at FROM facility_masters ORDER BY id`);
      return rows;
    }
  }
}

export async function getNextFacilityId(): Promise<string> {
  const [existing]: any = await db.query(`SELECT id FROM facility_masters WHERE id LIKE 'FAC-%' ORDER BY id DESC`);
  let nextNumber = 1;
  if (existing.length > 0) {
    const numbers = existing.map((row: any) => { const match = String(row.id).match(/FAC-(\d+)/i); return match ? Number(match[1]) : 0; }).filter((n: number) => Number.isFinite(n));
    if (numbers.length > 0) nextNumber = Math.max(...numbers) + 1;
  }
  return `FAC-${String(nextNumber).padStart(2, "0")}`;
}

export async function createFacility(input: CreateFacilityInput): Promise<void> {
  const stagesJson = input.workflowStages ? JSON.stringify(input.workflowStages) : null;
  const formConfigJson = input.formConfig ? JSON.stringify(input.formConfig) : null;
  try {
    await db.query(`INSERT INTO facility_masters (id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status, workflow_stages, form_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [input.id, input.name, input.dept || null, input.nodal, input.assocNodal, input.supervisor, input.desc || null, input.status, stagesJson, formConfigJson]);
  } catch (_) {
    try {
      await db.query(`INSERT INTO facility_masters (id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status, form_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [input.id, input.name, input.dept || null, input.nodal, input.assocNodal, input.supervisor, input.desc || null, input.status, formConfigJson]);
    } catch (_) {
      await db.query(`INSERT INTO facility_masters (id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [input.id, input.name, input.dept || null, input.nodal, input.assocNodal, input.supervisor, input.desc || null, input.status]);
    }
  }
}

export async function updateFacility(input: UpdateFacilityInput): Promise<any> {
  const stagesJson = input.workflowStages ? JSON.stringify(input.workflowStages) : null;
  const formConfigJson = input.formConfig ? JSON.stringify(input.formConfig) : null;
  try {
    const [result]: any = await db.query(`UPDATE facility_masters SET facility_name = ?, department = ?, nodal_officer_name = ?, assoc_nodal_officer_name = ?, supervisor_name = ?, description = ?, status = ?, workflow_stages = ?, form_config = ? WHERE id = ?`, [input.name, input.dept || null, input.nodal, input.assocNodal, input.supervisor, input.desc || null, input.status || "active", stagesJson, formConfigJson, input.id]);
    return result;
  } catch (_) {
    try {
      const [result]: any = await db.query(`UPDATE facility_masters SET facility_name = ?, department = ?, nodal_officer_name = ?, assoc_nodal_officer_name = ?, supervisor_name = ?, description = ?, status = ?, form_config = ? WHERE id = ?`, [input.name, input.dept || null, input.nodal, input.assocNodal, input.supervisor, input.desc || null, input.status || "active", formConfigJson, input.id]);
      return result;
    } catch (_) {
      const [result]: any = await db.query(`UPDATE facility_masters SET facility_name = ?, department = ?, nodal_officer_name = ?, assoc_nodal_officer_name = ?, supervisor_name = ?, description = ?, status = ? WHERE id = ?`, [input.name, input.dept || null, input.nodal, input.assocNodal, input.supervisor, input.desc || null, input.status || "active", input.id]);
      return result;
    }
  }
}

export async function deleteFacility(id: string): Promise<any> {
  const [result]: any = await db.query(`DELETE FROM facility_masters WHERE id = ?`, [id]);
  return result;
}
