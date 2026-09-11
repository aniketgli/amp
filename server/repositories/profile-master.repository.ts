import { db } from "../db/connection";

export interface ProfileEmploymentTypeMaster {
  id: number;
  code: string;
  displayName: string;
}

export interface ProfileOrgUnitMaster {
  id: number;
  unitType: "department" | "cell" | "project";
  unitName: string;
  description: string | null;
}

export interface ProfileBankMaster {
  id: number;
  bankName: string;
  bankCode: string | null;
}

export interface ProfileBatchSeriesMaster {
  id: number;
  seriesType: "msc" | "diploma_trainee";
  seriesName: string;
}

export interface ProfileBatchMaster {
  id: number;
  seriesId: number;
  seriesType: "msc" | "diploma_trainee";
  batchNumber: number;
  batchLabel: string;
  startYear: number;
  endYear: number;
}

export interface ProfileOfficerMaster {
  id: number;
  fullName: string;
  email: string;
  roles: string[];
}

export async function getEmploymentTypes(): Promise<
  ProfileEmploymentTypeMaster[]
> {
  const [rows]: any = await db.query(
    `
      SELECT
        id,
        code,
        display_name
      FROM profile_employment_types
      WHERE status = 'active'
      ORDER BY id ASC
    `,
  );

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    code: row.code,
    displayName: row.display_name,
  }));
}

export async function getOrgUnits(
  unitTypes?: string[],
): Promise<ProfileOrgUnitMaster[]> {
  const allowedTypes = ["department", "cell", "project"];

  const requestedTypes =
    unitTypes?.filter((type) => allowedTypes.includes(type)) || allowedTypes;

  if (requestedTypes.length === 0) {
    return [];
  }

  const placeholders = requestedTypes.map(() => "?").join(", ");

  const [rows]: any = await db.query(
    `
      SELECT
        id,
        unit_type,
        unit_name,
        description
      FROM profile_org_units
      WHERE status = 'active'
        AND unit_type IN (${placeholders})
      ORDER BY unit_type ASC, unit_name ASC
    `,
    requestedTypes,
  );

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    unitType: row.unit_type,
    unitName: row.unit_name,
    description: row.description ?? null,
  }));
}

export async function getBanks(): Promise<ProfileBankMaster[]> {
  const [rows]: any = await db.query(
    `
      SELECT
        id,
        bank_name,
        bank_code
      FROM profile_bank_masters
      WHERE status = 'active'
      ORDER BY bank_name ASC
    `,
  );

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    bankName: row.bank_name,
    bankCode: row.bank_code ?? null,
  }));
}

export async function getBatchSeries(
  seriesType?: string,
): Promise<ProfileBatchSeriesMaster[]> {
  const allowedTypes = ["msc", "diploma_trainee"];

  if (seriesType && !allowedTypes.includes(seriesType)) {
    return [];
  }

  const whereClause = seriesType ? "AND series_type = ?" : "";

  const params = seriesType ? [seriesType] : [];

  const [rows]: any = await db.query(
    `
      SELECT
        id,
        series_type,
        series_name
      FROM profile_batch_series
      WHERE status = 'active'
        ${whereClause}
      ORDER BY series_type ASC, series_name ASC
    `,
    params,
  );

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    seriesType: row.series_type,
    seriesName: row.series_name,
  }));
}

export async function getBatches(
  seriesType?: string,
): Promise<ProfileBatchMaster[]> {
  const allowedTypes = ["msc", "diploma_trainee"];

  if (seriesType && !allowedTypes.includes(seriesType)) {
    return [];
  }

  const whereClause = seriesType ? "AND s.series_type = ?" : "";

  const params = seriesType ? [seriesType] : [];

  const [rows]: any = await db.query(
    `
      SELECT
        b.id,
        b.series_id,
        s.series_type,
        b.batch_number,
        b.batch_label,
        b.start_year,
        b.end_year
      FROM profile_batches b
      INNER JOIN profile_batch_series s
        ON s.id = b.series_id
      WHERE b.status = 'active'
        AND s.status = 'active'
        ${whereClause}
      ORDER BY
        s.series_type ASC,
        b.start_year DESC,
        b.batch_number DESC
    `,
    params,
  );

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    seriesId: Number(row.series_id),
    seriesType: row.series_type,
    batchNumber: Number(row.batch_number),
    batchLabel: row.batch_label,
    startYear: Number(row.start_year),
    endYear: Number(row.end_year),
  }));
}

/*
 * Officers / Managers / PIs are sourced from the users table.
 *
 * Roles are returned with every user so the service/controller
 * can apply the appropriate role policy without trusting the
 * frontend.
 */
export async function getProfileOfficers(): Promise<ProfileOfficerMaster[]> {
  const [rows]: any = await db.query(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        GROUP_CONCAT(DISTINCT r.role_code ORDER BY r.role_code SEPARATOR ', ') AS roles
      FROM users u
      INNER JOIN user_roles ur
        ON ur.user_id = u.id
      INNER JOIN roles r
        ON r.id = ur.role_id
      WHERE u.status = 'active'
      GROUP BY
        u.id,
        u.full_name,
        u.email
      ORDER BY
        u.full_name ASC
    `,
  );

  return (rows || []).map((row: any) => ({
    id: Number(row.id),
    fullName: row.full_name,
    email: row.email,
    roles: row.role_codes ? String(row.role_codes).split(",") : [],
  }));
}
