import { db } from "../db/connection";

export type ProfileOrgUnitType = "department" | "cell" | "project";
export type MasterStatus = "active" | "inactive";

export interface ProfileEmploymentTypeMaster {
  id: number;
  code: string;
  displayName: string;
  status: MasterStatus;
}

export interface ProfileOrgUnitMaster {
  id: number;
  unitType: ProfileOrgUnitType;
  unitName: string;
  unitCode: string;
  description: string | null;
  status: MasterStatus;
}

export interface ProfileBankMaster {
  id: number;
  bankName: string;
  bankCode: string;
  status: MasterStatus;
}

export interface ProfileDesignationMaster {
  id: number;
  employmentTypeId: number;
  employmentTypeCode: string;
  employmentTypeName: string;
  designationName: string;
  designationCode: string;
  status: MasterStatus;
}

export interface ProfileStreamMaster {
  id: number;
  streamName: string;
  streamCode: string;
  status: MasterStatus;
}

export interface ProfileMscBatchMaster {
  id: number;
  streamId: number;
  streamName: string;
  streamCode: string;
  batchNumber: number;
  batchName: string;
  batchCode: string;
  validityStartYear: number;
  validityEndYear: number;
  status: MasterStatus;
}

export interface ProfileCourseMaster {
  id: number;
  courseName: string;
  courseCode: string;
  status: MasterStatus;
}

export interface ProfileTraineeBatchMaster {
  id: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  batchNumber: number;
  batchName: string;
  batchCode: string;
  validityStartYear: number;
  validityEndYear: number;
  status: MasterStatus;
}

export interface ProfileOfficerMaster {
  id: number;
  fullName: string;
  email: string;
  roles: string[];
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

export async function getEmploymentTypes(): Promise<ProfileEmploymentTypeMaster[]> {
  const [rows]: any = await db.query(`
    SELECT id, code, display_name, status
    FROM profile_employment_types
    ORDER BY id ASC
  `);
  return (rows || []).map((row: any) => ({ id: Number(row.id), code: String(row.code), displayName: String(row.display_name), status: row.status }));
}

export async function getOrgUnits(unitTypes?: ProfileOrgUnitType[]): Promise<ProfileOrgUnitMaster[]> {
  const allowed = new Set<ProfileOrgUnitType>(["department", "cell", "project"]);
  const requested = unitTypes?.filter((type) => allowed.has(type)) ?? ["department", "cell", "project"];
  if (!requested.length) return [];
  const placeholders = requested.map(() => "?").join(", ");
  const [rows]: any = await db.query(`
    SELECT id, unit_type, unit_name, unit_code, description, status
    FROM profile_org_units
    WHERE status = 'active' AND unit_type IN (${placeholders})
    ORDER BY unit_type ASC, unit_name ASC
  `, requested);
  return (rows || []).map((row: any) => ({ id: Number(row.id), unitType: row.unit_type, unitName: String(row.unit_name), unitCode: String(row.unit_code), description: row.description ?? null, status: row.status }));
}

export async function getBanks(): Promise<ProfileBankMaster[]> {
  const [rows]: any = await db.query(`SELECT id, bank_name, bank_code, status FROM profile_bank_masters WHERE status = 'active' ORDER BY bank_name ASC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), bankName: String(row.bank_name), bankCode: String(row.bank_code ?? ""), status: row.status }));
}

export async function getDesignations(employmentTypeId?: number): Promise<ProfileDesignationMaster[]> {
  const params: unknown[] = [];
  const filter = employmentTypeId ? "AND d.employment_type_id = ?" : "";
  if (employmentTypeId) params.push(employmentTypeId);
  const [rows]: any = await db.query(`
    SELECT d.id, d.employment_type_id, et.code AS employment_type_code, et.display_name AS employment_type_name, d.designation_name, d.designation_code, d.status
    FROM profile_designation_masters d
    INNER JOIN profile_employment_types et ON et.id = d.employment_type_id
    WHERE d.status = 'active' AND et.status = 'active' ${filter}
    ORDER BY et.id ASC, d.designation_name ASC
  `, params);
  return (rows || []).map((row: any) => ({ id: Number(row.id), employmentTypeId: Number(row.employment_type_id), employmentTypeCode: String(row.employment_type_code), employmentTypeName: String(row.employment_type_name), designationName: String(row.designation_name), designationCode: String(row.designation_code), status: row.status }));
}

export async function getStreams(): Promise<ProfileStreamMaster[]> {
  const [rows]: any = await db.query(`SELECT id, stream_name, stream_code, status FROM profile_stream_masters WHERE status = 'active' ORDER BY stream_name ASC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), streamName: String(row.stream_name), streamCode: String(row.stream_code), status: row.status }));
}

export async function getMscBatches(streamId?: number): Promise<ProfileMscBatchMaster[]> {
  const params: unknown[] = [];
  const filter = streamId ? "AND b.stream_id = ?" : "";
  if (streamId) params.push(streamId);
  const [rows]: any = await db.query(`
    SELECT b.id, b.stream_id, s.stream_name, s.stream_code, b.batch_number, b.batch_name, b.batch_code, b.validity_start_year, b.validity_end_year, b.status
    FROM profile_msc_batches b
    INNER JOIN profile_stream_masters s ON s.id = b.stream_id
    WHERE b.status = 'active' AND s.status = 'active' ${filter}
    ORDER BY s.stream_name ASC, b.batch_number DESC
  `, params);
  return (rows || []).map((row: any) => ({ id: Number(row.id), streamId: Number(row.stream_id), streamName: String(row.stream_name), streamCode: String(row.stream_code), batchNumber: Number(row.batch_number), batchName: String(row.batch_name), batchCode: String(row.batch_code), validityStartYear: Number(row.validity_start_year), validityEndYear: Number(row.validity_end_year), status: row.status }));
}

export async function getCourses(): Promise<ProfileCourseMaster[]> {
  const [rows]: any = await db.query(`SELECT id, course_name, course_code, status FROM profile_course_masters WHERE status = 'active' ORDER BY course_name ASC`);
  return (rows || []).map((row: any) => ({ id: Number(row.id), courseName: String(row.course_name), courseCode: String(row.course_code), status: row.status }));
}

export async function getTraineeBatches(courseId?: number): Promise<ProfileTraineeBatchMaster[]> {
  const params: unknown[] = [];
  const filter = courseId ? "AND b.course_id = ?" : "";
  if (courseId) params.push(courseId);
  const [rows]: any = await db.query(`
    SELECT b.id, b.course_id, c.course_name, c.course_code, b.batch_number, b.batch_name, b.batch_code, b.validity_start_year, b.validity_end_year, b.status
    FROM profile_trainee_batches b
    INNER JOIN profile_course_masters c ON c.id = b.course_id
    WHERE b.status = 'active' AND c.status = 'active' ${filter}
    ORDER BY c.course_name ASC, b.batch_number DESC
  `, params);
  return (rows || []).map((row: any) => ({ id: Number(row.id), courseId: Number(row.course_id), courseName: String(row.course_name), courseCode: String(row.course_code), batchNumber: Number(row.batch_number), batchName: String(row.batch_name), batchCode: String(row.batch_code), validityStartYear: Number(row.validity_start_year), validityEndYear: Number(row.validity_end_year), status: row.status }));
}

export async function getProfileOfficers(): Promise<ProfileOfficerMaster[]> {
  const [rows]: any = await db.query(`
    SELECT u.id, u.full_name, u.email, GROUP_CONCAT(DISTINCT r.role_code ORDER BY r.role_code SEPARATOR ', ') AS roles
    FROM users u
    INNER JOIN user_roles ur ON ur.user_id = u.id
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE u.status = 'active'
    GROUP BY u.id, u.full_name, u.email
    ORDER BY u.full_name ASC
  `);
  return (rows || []).map((row: any) => ({ id: Number(row.id), fullName: String(row.full_name), email: String(row.email), roles: row.roles ? String(row.roles).split(", ") : [] }));
}

/* Legacy read APIs remain available while existing profile screens migrate. */
export async function getBatchSeries(seriesType?: string): Promise<ProfileBatchSeriesMaster[]> {
  const allowed = ["msc", "diploma_trainee"];
  if (seriesType && !allowed.includes(seriesType)) return [];
  const filter = seriesType ? "AND series_type = ?" : "";
  const params = seriesType ? [seriesType] : [];
  const [rows]: any = await db.query(`SELECT id, series_type, series_name FROM profile_batch_series WHERE status = 'active' ${filter} ORDER BY series_type, series_name`, params);
  return (rows || []).map((row: any) => ({ id: Number(row.id), seriesType: row.series_type, seriesName: row.series_name }));
}

export async function getBatches(seriesType?: string): Promise<ProfileBatchMaster[]> {
  const allowed = ["msc", "diploma_trainee"];
  if (seriesType && !allowed.includes(seriesType)) return [];
  const filter = seriesType ? "AND s.series_type = ?" : "";
  const params = seriesType ? [seriesType] : [];
  const [rows]: any = await db.query(`
    SELECT b.id, b.series_id, s.series_type, b.batch_number, b.batch_label, b.start_year, b.end_year
    FROM profile_batches b INNER JOIN profile_batch_series s ON s.id = b.series_id
    WHERE b.status = 'active' AND s.status = 'active' ${filter}
    ORDER BY s.series_type, b.start_year DESC, b.batch_number DESC
  `, params);
  return (rows || []).map((row: any) => ({ id: Number(row.id), seriesId: Number(row.series_id), seriesType: row.series_type, batchNumber: Number(row.batch_number), batchLabel: String(row.batch_label), startYear: Number(row.start_year), endYear: Number(row.end_year) }));
}
