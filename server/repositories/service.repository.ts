import { db } from "../db/connection";

/**
 * Service Repository
 *
 * Only database-related operations for service_masters
 * should live here.
 */

export interface CreateServiceInput {
  id: string;
  name: string;
  manager: string;
  quota?: string | null;
  status: string;
  workflowStages?: unknown[] | null;
  formConfig?: Record<string, unknown> | null;
}

export interface UpdateServiceInput {
  id: string;
  name: string;
  manager: string;
  quota?: string | null;
  status?: string;
  workflowStages?: unknown[] | null;
  formConfig?: Record<string, unknown> | null;
}

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
        form_config,
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

export async function createService(input: CreateServiceInput): Promise<void> {
  const stagesJson = input.workflowStages
    ? JSON.stringify(input.workflowStages)
    : null;
  const formConfigJson = input.formConfig
    ? JSON.stringify(input.formConfig)
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
          workflow_stages,
          form_config
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        input.id,
        input.name,
        input.manager,
        input.quota || null,
        input.status,
        stagesJson,
        formConfigJson,
      ],
    );
  } catch (_) {
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
            form_config
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [input.id, input.name, input.manager, input.quota || null, input.status, formConfigJson],
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
}

export async function updateService(input: UpdateServiceInput): Promise<any> {
  const stagesJson = input.workflowStages
    ? JSON.stringify(input.workflowStages)
    : null;
  const formConfigJson = input.formConfig
    ? JSON.stringify(input.formConfig)
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
          workflow_stages = ?,
          form_config = ?
        WHERE id = ?
      `,
      [
        input.name,
        input.manager,
        input.quota || null,
        input.status || "active",
        stagesJson,
        formConfigJson,
        input.id,
      ],
    );

    return result;
  } catch (_) {
    try {
      const [result]: any = await db.query(
        `
          UPDATE service_masters
          SET
            service_name = ?,
            manager_name = ?,
            quota_access_specs = ?,
            status = ?,
            form_config = ?
          WHERE id = ?
        `,
        [
          input.name,
          input.manager,
          input.quota || null,
          input.status || "active",
          formConfigJson,
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
}

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
