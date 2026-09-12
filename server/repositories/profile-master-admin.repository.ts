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

export interface AdminProfileOrgUnit {
  id: number;
  unitType: "department" | "cell" | "project";
  unitName: string;
  description: string | null;
  status: "active" | "inactive";
}

export interface AdminProfileBank {
  id: number;
  bankName: string;
  bankCode: string | null;
  status: "active" | "inactive";
}

export interface AdminProfileBatch {
  id: number;
  seriesId: number;
  seriesType: "msc" | "diploma_trainee";
  seriesName: string;
  batchNumber: number;
  batchLabel: string;
  startYear: number;
  endYear: number;
  status: "active" | "inactive";
}

/* ============================================================
   ADMIN MASTER LISTS
   IMPORTANT:
   These queries intentionally return BOTH active and inactive
   records so Administrator can reactivate inactive masters.
   ============================================================ */

export async function listAllOrgUnits(): Promise<AdminProfileOrgUnit[]> {
  const [rows]: any = await db.query(
    `
      SELECT
        id,
        unit_type,
        unit_name,
        description,
        status
      FROM profile_org_units
      ORDER BY
        unit_type ASC,
        unit_name ASC
    `,
  );

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    unitType: row.unit_type,
    unitName: row.unit_name,
    description: row.description ?? null,
    status: row.status,
  }));
}

export async function listAllBanks(): Promise<AdminProfileBank[]> {
  const [rows]: any = await db.query(
    `
      SELECT
        id,
        bank_name,
        bank_code,
        status
      FROM profile_bank_masters
      ORDER BY
        bank_name ASC
    `,
  );

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    bankName: row.bank_name,
    bankCode: row.bank_code ?? null,
    status: row.status,
  }));
}

export async function listAllBatches(): Promise<AdminProfileBatch[]> {
  const [rows]: any = await db.query(
    `
      SELECT
        b.id,
        b.series_id,
        s.series_type,
        s.series_name,
        b.batch_number,
        b.batch_label,
        b.start_year,
        b.end_year,
        b.status
      FROM profile_batches b
      INNER JOIN profile_batch_series s
        ON s.id = b.series_id
      ORDER BY
        s.series_type ASC,
        b.start_year DESC,
        b.batch_number DESC
    `,
  );

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    seriesId: Number(row.series_id),
    seriesType: row.series_type,
    seriesName: row.series_name,
    batchNumber: Number(row.batch_number),
    batchLabel: row.batch_label,
    startYear: Number(row.start_year),
    endYear: Number(row.end_year),
    status: row.status,
  }));
}

/* ============================================================
   ORGANIZATION UNITS
   ============================================================ */

export async function createOrgUnit(input: CreateOrgUnitInput) {
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
    [input.unitType, input.unitName, input.description || null],
  );

  return {
    id: Number(result.insertId),
    ...input,
    status: "active",
  };
}

export async function updateOrgUnit(id: number, input: CreateOrgUnitInput) {
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
    [input.unitType, input.unitName, input.description || null, id],
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

/* ============================================================
   BANKS
   ============================================================ */

export async function createBank(input: CreateBankInput) {
  const [result]: any = await db.query(
    `
      INSERT INTO profile_bank_masters (
        bank_name,
        bank_code,
        status
      )
      VALUES (?, ?, 'active')
    `,
    [input.bankName, input.bankCode || null],
  );

  return {
    id: Number(result.insertId),
    ...input,
    status: "active",
  };
}

export async function updateBank(id: number, input: CreateBankInput) {
  await db.query(
    `
      UPDATE profile_bank_masters
      SET
        bank_name = ?,
        bank_code = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [input.bankName, input.bankCode || null, id],
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

export async function setBankStatus(id: number, status: "active" | "inactive") {
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

/* ============================================================
   BATCHES
   ============================================================ */

export async function createBatch(input: CreateBatchInput) {
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

export async function updateBatch(id: number, input: CreateBatchInput) {
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
