import { db } from "../db/connection";

/**
 * Service Repository
 *
 * Only database-related operations for service_masters
 * should live here.
 *
 * Route-level validation, authentication, authorization,
 * response formatting, and fallback handling remain in routes.
 */

export interface CreateServiceInput {
  id: string;
  name: string;
  manager: string;
  quota?: string | null;
  status: string;
  workflowStages?: unknown[] | null;
}

export interface UpdateServiceInput {
  id: string;
  name: string;
  manager: string;
  quota?: string | null;
  status?: string;
  workflowStages?: unknown[] | null;
}

/**
 * Get all services.
 *
 * Primary query includes workflow_stages.
 * Fallback query supports older databases where
 * workflow_stages may not exist yet.
 */
export async function getAllServices(): Promise<any[]> {
  try {
    const [rows]: any = await db.query(`
      SELECT
        id,
        service_name,
        manager_name,
        quota_access_specs,
        status,
        workflow_stages,
        created_at,
        updated_at
      FROM service_masters
      ORDER BY id
    `);

    return rows;
  } catch (_) {
    const [rows]: any = await db.query(`
      SELECT
        id,
        service_name,
        manager_name,
        quota_access_specs,
        status,
        created_at,
        updated_at
      FROM service_masters
      ORDER BY id
    `);

    return rows;
  }
}

/**
 * Generate the next SRV-XX identifier.
 *
 * This preserves the existing identifier-generation logic
 * currently used by the Services route.
 */
export async function getNextServiceId(): Promise<string> {
  const [existing]: any = await db.query(`
    SELECT id
    FROM service_masters
    WHERE id LIKE 'SRV-%'
    ORDER BY id DESC
  `);

  let nextNumber = 1;

  if (existing.length > 0) {
    const numbers = existing
      .map((row: any) => {
        const match = String(row.id).match(/SRV-(\d+)/i);
        return match ? Number(match[1]) : 0;
      })
      .filter((n: number) => Number.isFinite(n));

    if (numbers.length > 0) {
      nextNumber = Math.max(...numbers) + 1;
    }
  }

  return `SRV-${String(nextNumber).padStart(2, "0")}`;
}

/**
 * Create a service.
 *
 * First attempts to write workflow_stages.
 * Falls back to the older schema if that column
 * is not available.
 */
export async function createService(input: CreateServiceInput): Promise<void> {
  const stagesJson = input.workflowStages
    ? JSON.stringify(input.workflowStages)
    : null;

  try {
    await db.query(
      `
        INSERT INTO service_masters
        (
          id,
          service_name,
          manager_name,
          quota_access_specs,
          status,
          workflow_stages
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        input.id,
        input.name,
        input.manager,
        input.quota || null,
        input.status,
        stagesJson,
      ],
    );
  } catch (_) {
    await db.query(
      `
        INSERT INTO service_masters
        (
          id,
          service_name,
          manager_name,
          quota_access_specs,
          status
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [input.id, input.name, input.manager, input.quota || null, input.status],
    );
  }
}

/**
 * Update a service.
 *
 * First attempts to update workflow_stages.
 * Falls back to the older schema if necessary.
 */
export async function updateService(input: UpdateServiceInput): Promise<any> {
  const stagesJson = input.workflowStages
    ? JSON.stringify(input.workflowStages)
    : null;

  try {
    const [result]: any = await db.query(
      `
        UPDATE service_masters
        SET
          service_name = ?,
          manager_name = ?,
          quota_access_specs = ?,
          status = ?,
          workflow_stages = ?
        WHERE id = ?
      `,
      [
        input.name,
        input.manager,
        input.quota || null,
        input.status || "active",
        stagesJson,
        input.id,
      ],
    );

    return result;
  } catch (_) {
    const [result]: any = await db.query(
      `
        UPDATE service_masters
        SET
          service_name = ?,
          manager_name = ?,
          quota_access_specs = ?,
          status = ?
        WHERE id = ?
      `,
      [
        input.name,
        input.manager,
        input.quota || null,
        input.status || "active",
        input.id,
      ],
    );

    return result;
  }
}

/**
 * Delete a service.
 */
export async function deleteService(id: string): Promise<any> {
  const [result]: any = await db.query(
    `
      DELETE FROM service_masters
      WHERE id = ?
    `,
    [id],
  );

  return result;
}
