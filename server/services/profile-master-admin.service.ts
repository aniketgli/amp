import {
  listAllOrgUnits,
  listAllBanks,
  listAllBatches,
  createOrgUnit,
  updateOrgUnit,
  setOrgUnitStatus,
  createBank,
  updateBank,
  setBankStatus,
  createBatch,
  updateBatch,
  setBatchStatus,
} from "../repositories/profile-master-admin.repository";

import { db } from "../db/connection";

const ORG_UNIT_TYPES = new Set(["department", "cell", "project"]);

const BATCH_SERIES_TYPES = new Set(["msc", "diploma_trainee"]);

function cleanString(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function requireString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  const valueClean = cleanString(value);

  if (!valueClean) {
    throw new Error(`${fieldName} is required.`);
  }

  if (valueClean.length > maxLength) {
    throw new Error(`${fieldName} cannot exceed ${maxLength} characters.`);
  }

  return valueClean;
}

function validatePositiveInteger(value: unknown, fieldName: string): number {
  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer.`);
  }

  return numberValue;
}

function validateYear(value: unknown, fieldName: string): number {
  const year = validatePositiveInteger(value, fieldName);

  if (year < 1900 || year > 2200) {
    throw new Error(`${fieldName} must be between 1900 and 2200.`);
  }

  return year;
}

function validateStatus(value: unknown): "active" | "inactive" {
  const status = cleanString(value).toLowerCase();

  if (status !== "active" && status !== "inactive") {
    throw new Error("Status must be active or inactive.");
  }

  return status;
}

async function orgUnitExists(
  unitType: string,
  unitName: string,
  excludeId?: number,
): Promise<boolean> {
  const params: unknown[] = [unitType, unitName];

  let excludeClause = "";

  if (excludeId !== undefined) {
    excludeClause = "AND id <> ?";
    params.push(excludeId);
  }

  const [rows]: any = await db.query(
    `
      SELECT id
      FROM profile_org_units
      WHERE unit_type = ?
        AND LOWER(TRIM(unit_name)) =
            LOWER(TRIM(?))
        ${excludeClause}
      LIMIT 1
    `,
    params,
  );

  return Boolean(rows?.length);
}

async function bankExists(
  bankName: string,
  excludeId?: number,
): Promise<boolean> {
  const params: unknown[] = [bankName];

  let excludeClause = "";

  if (excludeId !== undefined) {
    excludeClause = "AND id <> ?";
    params.push(excludeId);
  }

  const [rows]: any = await db.query(
    `
      SELECT id
      FROM profile_bank_masters
      WHERE LOWER(TRIM(bank_name)) =
            LOWER(TRIM(?))
        ${excludeClause}
      LIMIT 1
    `,
    params,
  );

  return Boolean(rows?.length);
}

async function seriesExists(seriesId: number): Promise<boolean> {
  const [rows]: any = await db.query(
    `
      SELECT id
      FROM profile_batch_series
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
    `,
    [seriesId],
  );

  return Boolean(rows?.length);
}

async function batchExists(
  seriesId: number,
  batchNumber: number,
  excludeId?: number,
): Promise<boolean> {
  const params: unknown[] = [seriesId, batchNumber];

  let excludeClause = "";

  if (excludeId !== undefined) {
    excludeClause = "AND id <> ?";
    params.push(excludeId);
  }

  const [rows]: any = await db.query(
    `
      SELECT id
      FROM profile_batches
      WHERE series_id = ?
        AND batch_number = ?
        ${excludeClause}
      LIMIT 1
    `,
    params,
  );

  return Boolean(rows?.length);
}

async function getSeriesType(seriesId: number): Promise<string | null> {
  const [rows]: any = await db.query(
    `
      SELECT series_type
      FROM profile_batch_series
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
    `,
    [seriesId],
  );

  return rows?.[0]?.series_type ? String(rows[0].series_type) : null;
}

/* =========================
   ORGANIZATION UNITS
   ========================= */

export async function addOrgUnit(input: any) {
  const unitType = cleanString(input?.unitType).toLowerCase();

  if (!ORG_UNIT_TYPES.has(unitType)) {
    throw new Error("Invalid organization unit type.");
  }

  const unitName = requireString(input?.unitName, "Unit Name", 255);

  const description = cleanString(input?.description) || null;

  if (await orgUnitExists(unitType, unitName)) {
    throw new Error("An organization unit with the same name already exists.");
  }

  return createOrgUnit({
    unitType: unitType as "department" | "cell" | "project",
    unitName,
    description,
  });
}

export async function editOrgUnit(idInput: unknown, input: any) {
  const id = validatePositiveInteger(idInput, "Organization Unit ID");

  const unitType = cleanString(input?.unitType).toLowerCase();

  if (!ORG_UNIT_TYPES.has(unitType)) {
    throw new Error("Invalid organization unit type.");
  }

  const unitName = requireString(input?.unitName, "Unit Name", 255);

  const description = cleanString(input?.description) || null;

  if (await orgUnitExists(unitType, unitName, id)) {
    throw new Error("An organization unit with the same name already exists.");
  }

  const updated = await updateOrgUnit(id, {
    unitType: unitType as "department" | "cell" | "project",
    unitName,
    description,
  });

  if (!updated) {
    throw new Error("Organization unit not found.");
  }

  return updated;
}

export async function changeOrgUnitStatus(
  idInput: unknown,
  statusInput: unknown,
) {
  const id = validatePositiveInteger(idInput, "Organization Unit ID");

  const status = validateStatus(statusInput);

  await setOrgUnitStatus(id, status);

  return {
    id,
    status,
  };
}

/* =========================
   BANKS
   ========================= */

export async function addBank(input: any) {
  const bankName = requireString(input?.bankName, "Bank Name", 200);

  const bankCode = cleanString(input?.bankCode) || null;

  if (bankCode && bankCode.length > 50) {
    throw new Error("Bank Code cannot exceed 50 characters.");
  }

  if (await bankExists(bankName)) {
    throw new Error("A bank with the same name already exists.");
  }

  return createBank({
    bankName,
    bankCode,
  });
}

export async function editBank(idInput: unknown, input: any) {
  const id = validatePositiveInteger(idInput, "Bank ID");

  const bankName = requireString(input?.bankName, "Bank Name", 200);

  const bankCode = cleanString(input?.bankCode) || null;

  if (bankCode && bankCode.length > 50) {
    throw new Error("Bank Code cannot exceed 50 characters.");
  }

  if (await bankExists(bankName, id)) {
    throw new Error("A bank with the same name already exists.");
  }

  const updated = await updateBank(id, {
    bankName,
    bankCode,
  });

  if (!updated) {
    throw new Error("Bank not found.");
  }

  return updated;
}

export async function changeBankStatus(idInput: unknown, statusInput: unknown) {
  const id = validatePositiveInteger(idInput, "Bank ID");

  const status = validateStatus(statusInput);

  await setBankStatus(id, status);

  return {
    id,
    status,
  };
}

/* =========================
   BATCHES
   ========================= */

export async function addBatch(input: any) {
  const seriesId = validatePositiveInteger(input?.seriesId, "Batch Series ID");

  if (!(await seriesExists(seriesId))) {
    throw new Error("Selected batch series is invalid or inactive.");
  }

  const batchNumber = validatePositiveInteger(
    input?.batchNumber,
    "Batch Number",
  );

  const batchLabel = requireString(input?.batchLabel, "Batch Label", 100);

  const startYear = validateYear(input?.startYear, "Start Year");

  const endYear = validateYear(input?.endYear, "End Year");

  if (endYear < startYear) {
    throw new Error("End Year cannot be earlier than Start Year.");
  }

  if (await batchExists(seriesId, batchNumber)) {
    throw new Error("This batch number already exists in the selected series.");
  }

  /*
   * The series is authoritative.
   *
   * MSc batches can only belong to the MSc series,
   * and Diploma Trainee batches can only belong to
   * the Diploma Trainee series.
   */
  const seriesType = await getSeriesType(seriesId);

  if (!seriesType || !BATCH_SERIES_TYPES.has(seriesType)) {
    throw new Error("Invalid batch series.");
  }

  return createBatch({
    seriesId,
    batchNumber,
    batchLabel,
    startYear,
    endYear,
  });
}

export async function editBatch(idInput: unknown, input: any) {
  const id = validatePositiveInteger(idInput, "Batch ID");

  const seriesId = validatePositiveInteger(input?.seriesId, "Batch Series ID");

  if (!(await seriesExists(seriesId))) {
    throw new Error("Selected batch series is invalid or inactive.");
  }

  const batchNumber = validatePositiveInteger(
    input?.batchNumber,
    "Batch Number",
  );

  const batchLabel = requireString(input?.batchLabel, "Batch Label", 100);

  const startYear = validateYear(input?.startYear, "Start Year");

  const endYear = validateYear(input?.endYear, "End Year");

  if (endYear < startYear) {
    throw new Error("End Year cannot be earlier than Start Year.");
  }

  if (await batchExists(seriesId, batchNumber, id)) {
    throw new Error("This batch number already exists in the selected series.");
  }

  const seriesType = await getSeriesType(seriesId);

  if (!seriesType || !BATCH_SERIES_TYPES.has(seriesType)) {
    throw new Error("Invalid batch series.");
  }

  const updated = await updateBatch(id, {
    seriesId,
    batchNumber,
    batchLabel,
    startYear,
    endYear,
  });

  if (!updated) {
    throw new Error("Batch not found.");
  }

  return updated;
}

export async function changeBatchStatus(
  idInput: unknown,
  statusInput: unknown,
) {
  const id = validatePositiveInteger(idInput, "Batch ID");

  const status = validateStatus(statusInput);

  await setBatchStatus(id, status);

  return {
    id,
    status,
  };
}

/* =========================
   ADMIN MASTER LISTS
   ========================= */

/**
 * Returns all organization units for administrator management,
 * including inactive records.
 */
export async function listAdminOrgUnits() {
  return listAllOrgUnits();
}

/**
 * Returns all banks for administrator management,
 * including inactive records.
 */
export async function listAdminBanks() {
  return listAllBanks();
}

/**
 * Returns all batches for administrator management,
 * including inactive records.
 */
export async function listAdminBatches() {
  return listAllBatches();
}
