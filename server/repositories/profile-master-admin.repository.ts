import { db } from "../db/connection";

export interface CreateOrgUnitInput {
  unitType: "department" | "cell" | "project";
  unitName: string;
  description?: string | null;
}

export interface CreateBankInput {
  bankName: string;
  bankCode?: string | null;
}

export interface CreateBatchInput {
  seriesId: number;
  batchNumber: number;
  batchLabel: string;
  startYear: number;
  endYear: number;
}

export async function createOrgUnit(
  input: CreateOrgUnitInput,
) {
  const [result]: any = await db.query(
    `
      INSERT INTO profile_org_units (
        unit_type,
        unit_name,
        description,
        status
      )
      VALUES (?, ?, ?, 'active')
    `,
    [
      input.unitType,
      input.unitName,
      input.description || null,
    ],
  );

  return {
    id: Number(result.insertId),
    ...input,
    status: "active",
  };
}

export async function updateOrgUnit(
  id: number,
  input: CreateOrgUnitInput,
) {
  await db.query(
    `
      UPDATE profile_org_units
      SET
        unit_type = ?,
        unit_name = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      input.unitType,
      input.unitName,
      input.description || null,
      id,
    ],
  );

  const [rows]: any = await db.query(
    `
      SELECT
        id,
        unit_type,
        unit_name,
        description,
        status
      FROM profile_org_units
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows?.[0] || null;
}

export async function setOrgUnitStatus(
  id: number,
  status: "active" | "inactive",
) {
  await db.query(
    `
      UPDATE profile_org_units
      SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [status, id],
  );
}

export async function createBank(
  input: CreateBankInput,
) {
  const [result]: any = await db.query(
    `
      INSERT INTO profile_bank_masters (
        bank_name,
        bank_code,
        status
      )
      VALUES (?, ?, 'active')
    `,
    [
      input.bankName,
      input.bankCode || null,
    ],
  );

  return {
    id: Number(result.insertId),
    ...input,
    status: "active",
  };
}

export async function updateBank(
  id: number,
  input: CreateBankInput,
) {
  await db.query(
    `
      UPDATE profile_bank_masters
      SET
        bank_name = ?,
        bank_code = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      input.bankName,
      input.bankCode || null,
      id,
    ],
  );

  const [rows]: any = await db.query(
    `
      SELECT
        id,
        bank_name,
        bank_code,
        status
      FROM profile_bank_masters
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows?.[0] || null;
}

export async function setBankStatus(
  id: number,
  status: "active" | "inactive",
) {
  await db.query(
    `
      UPDATE profile_bank_masters
      SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [status, id],
  );
}

export async function createBatch(
  input: CreateBatchInput,
) {
  const [result]: any = await db.query(
    `
      INSERT INTO profile_batches (
        series_id,
        batch_number,
        batch_label,
        start_year,
        end_year,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'active')
    `,
    [
      input.seriesId,
      input.batchNumber,
      input.batchLabel,
      input.startYear,
      input.endYear,
    ],
  );

  return {
    id: Number(result.insertId),
    ...input,
    status: "active",
  };
}

export async function updateBatch(
  id: number,
  input: CreateBatchInput,
) {
  await db.query(
    `
      UPDATE profile_batches
      SET
        series_id = ?,
        batch_number = ?,
        batch_label = ?,
        start_year = ?,
        end_year = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      input.seriesId,
      input.batchNumber,
      input.batchLabel,
      input.startYear,
      input.endYear,
      id,
    ],
  );

  const [rows]: any = await db.query(
    `
      SELECT
        id,
        series_id,
        batch_number,
        batch_label,
        start_year,
        end_year,
        status
      FROM profile_batches
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows?.[0] || null;
}

export async function setBatchStatus(
  id: number,
  status: "active" | "inactive",
) {
  await db.query(
    `
      UPDATE profile_batches
      SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [status, id],
  );
}
