import { db } from "../db/connection";

/**
 * Facility Repository
 *
 * Only database-related operations for facility_masters
 * should live here.
 *
 * Route-level validation, authentication, authorization,
 * response formatting, and fallback handling remain in routes.
 */

export interface CreateFacilityInput {
  id: string;
  name: string;
  dept?: string | null;
  nodal: string;
  assocNodal: string;
  supervisor: string;
  desc?: string | null;
  status: string;
  workflowStages?: unknown[] | null;
}

export interface UpdateFacilityInput {
  id: string;
  name: string;
  dept?: string | null;
  nodal: string;
  assocNodal: string;
  supervisor: string;
  desc?: string | null;
  status?: string;
  workflowStages?: unknown[] | null;
}

/**
 * Get all facilities.
 *
 * Primary query includes workflow_stages.
 * Fallback query supports older databases where
 * workflow_stages may not exist yet.
 */
export async function getAllFacilities(): Promise<any[]> {
  try {
    const [rows]: any = await db.query(`
      SELECT
        id,
        facility_name,
        department,
        nodal_officer_name,
        assoc_nodal_officer_name,
        supervisor_name,
        description,
        status,
        workflow_stages,
        created_at,
        updated_at
      FROM facility_masters
      ORDER BY id
    `);

    return rows;
  } catch (_) {
    const [rows]: any = await db.query(`
      SELECT
        id,
        facility_name,
        department,
        nodal_officer_name,
        assoc_nodal_officer_name,
        supervisor_name,
        description,
        status,
        created_at,
        updated_at
      FROM facility_masters
      ORDER BY id
    `);

    return rows;
  }
}

/**
 * Generate the next FAC-XX identifier.
 *
 * This preserves the existing identifier-generation logic
 * currently used by the Facilities route.
 */
export async function getNextFacilityId(): Promise<string> {
  const [existing]: any = await db.query(`
    SELECT id
    FROM facility_masters
    WHERE id LIKE 'FAC-%'
    ORDER BY id DESC
  `);

  let nextNumber = 1;

  if (existing.length > 0) {
    const numbers = existing
      .map((row: any) => {
        const match = String(row.id).match(/FAC-(\d+)/i);
        return match ? Number(match[1]) : 0;
      })
      .filter((n: number) => Number.isFinite(n));

    if (numbers.length > 0) {
      nextNumber = Math.max(...numbers) + 1;
    }
  }

  return `FAC-${String(nextNumber).padStart(2, "0")}`;
}

/**
 * Create a facility.
 *
 * First attempts to write workflow_stages.
 * Falls back to the older schema if that column
 * is not available.
 */
export async function createFacility(
  input: CreateFacilityInput,
): Promise<void> {
  const stagesJson = input.workflowStages
    ? JSON.stringify(input.workflowStages)
    : null;

  try {
    await db.query(
      `
        INSERT INTO facility_masters
        (
          id,
          facility_name,
          department,
          nodal_officer_name,
          assoc_nodal_officer_name,
          supervisor_name,
          description,
          status,
          workflow_stages
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        input.id,
        input.name,
        input.dept || null,
        input.nodal,
        input.assocNodal,
        input.supervisor,
        input.desc || null,
        input.status,
        stagesJson,
      ],
    );
  } catch (_) {
    await db.query(
      `
        INSERT INTO facility_masters
        (
          id,
          facility_name,
          department,
          nodal_officer_name,
          assoc_nodal_officer_name,
          supervisor_name,
          description,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        input.id,
        input.name,
        input.dept || null,
        input.nodal,
        input.assocNodal,
        input.supervisor,
        input.desc || null,
        input.status,
      ],
    );
  }
}

/**
 * Update a facility.
 *
 * First attempts to update workflow_stages.
 * Falls back to the older schema if necessary.
 */
export async function updateFacility(
  input: UpdateFacilityInput,
): Promise<any> {
  const stagesJson = input.workflowStages
    ? JSON.stringify(input.workflowStages)
    : null;

  try {
    const [result]: any = await db.query(
      `
        UPDATE facility_masters
        SET
          facility_name = ?,
          department = ?,
          nodal_officer_name = ?,
          assoc_nodal_officer_name = ?,
          supervisor_name = ?,
          description = ?,
          status = ?,
          workflow_stages = ?
        WHERE id = ?
      `,
      [
        input.name,
        input.dept || null,
        input.nodal,
        input.assocNodal,
        input.supervisor,
        input.desc || null,
        input.status || "active",
        stagesJson,
        input.id,
      ],
    );

    return result;
  } catch (_) {
    const [result]: any = await db.query(
      `
        UPDATE facility_masters
        SET
          facility_name = ?,
          department = ?,
          nodal_officer_name = ?,
          assoc_nodal_officer_name = ?,
          supervisor_name = ?,
          description = ?,
          status = ?
        WHERE id = ?
      `,
      [
        input.name,
        input.dept || null,
        input.nodal,
        input.assocNodal,
        input.supervisor,
        input.desc || null,
        input.status || "active",
        input.id,
      ],
    );

    return result;
  }
}

/**
 * Delete a facility.
 */
export async function deleteFacility(id: string): Promise<any> {
  const [result]: any = await db.query(
    `
      DELETE FROM facility_masters
      WHERE id = ?
    `,
    [id],
  );

  return result;
}