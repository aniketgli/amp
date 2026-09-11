import type { PoolConnection } from "mysql2/promise";
import { db } from "../db/connection";

export interface ApplicantProfileRecord {
  id?: number;
  userId: number | string;

  profilePhotoPath?: string | null;
  salutation?: string | null;
  applicantName: string;
  employmentType?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  mobileNo: string;
  personalEmail: string;
  wiiOfficialEmail?: string | null;

  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;

  designation?: string | null;
  stream?: string | null;
  courseName?: string | null;

  departmentCellProject?: string | null;
  supervisingOfficerId?: number | string | null;
  supervisingOfficerName?: string | null;

  departmentId?: number | null;
  projectId?: number | null;
  reportingOfficerId?: number | null;
  reportingManagerId?: number | null;
  piUserId?: number | null;
  batchId?: number | null;

  dateOfJoining?: string | null;
  validUpTo?: string | null;

  panNo?: string | null;
  bankName?: string | null;
  accountNo?: string | null;
  ifscCode?: string | null;

  officeOrderFileName?: string | null;
  biometricId?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value);

  return text.length >= 10 ? text.slice(0, 10) : text;
}

function mapProfile(row: any): ApplicantProfileRecord {
  return {
    id: row.id,
    userId: row.user_id,

    profilePhotoPath: row.profile_photo_path,
    salutation: row.salutation,
    applicantName: row.applicant_name,
    employmentType: row.employment_type,
    gender: row.gender,
    dateOfBirth: normalizeDate(row.date_of_birth),
    bloodGroup: row.blood_group,
    mobileNo: row.mobile_no,
    personalEmail: row.personal_email,
    wiiOfficialEmail: row.wii_official_email,

    address: row.address,
    city: row.city,
    state: row.state,
    pincode: row.pincode,

    designation: row.designation,
    stream: row.stream,
    courseName: row.course_name,

    departmentCellProject: row.department_cell_project,
    supervisingOfficerId: row.supervising_officer_id,
    supervisingOfficerName: row.supervising_officer_name,

    departmentId: row.department_id,
    projectId: row.project_id,
    reportingOfficerId: row.reporting_officer_id,
    reportingManagerId: row.reporting_manager_id,
    piUserId: row.pi_user_id,
    batchId: row.batch_id,

    dateOfJoining: normalizeDate(row.date_of_joining),
    validUpTo: normalizeDate(row.valid_up_to),

    panNo: row.pan_no,
    bankName: row.bank_name,
    accountNo: row.account_no,
    ifscCode: row.ifsc_code,

    officeOrderFileName: row.office_order_file_name,
    biometricId: row.biometric_id,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PROFILE_SELECT = `
  SELECT
    id,
    user_id,

    profile_photo_path,
    salutation,
    applicant_name,
    employment_type,
    gender,
    date_of_birth,
    blood_group,
    mobile_no,
    personal_email,
    wii_official_email,

    address,
    city,
    state,
    pincode,

    designation,
    stream,
    course_name,

    department_cell_project,
    supervising_officer_id,
    supervising_officer_name,

    department_id,
    project_id,
    reporting_officer_id,
    reporting_manager_id,
    pi_user_id,
    batch_id,

    date_of_joining,
    valid_up_to,

    pan_no,
    bank_name,
    account_no,
    ifsc_code,

    office_order_file_name,
    biometric_id,

    created_at,
    updated_at

  FROM applicant_profiles
  WHERE user_id = ?
  LIMIT 1
`;

export async function getProfileByUserId(
  userId: number | string,
): Promise<ApplicantProfileRecord | null> {
  const [rows]: any = await db.query(
    PROFILE_SELECT,
    [userId],
  );

  return rows?.[0] ? mapProfile(rows[0]) : null;
}

/*
 * Transaction-aware profile read.
 *
 * The caller owns the transaction and therefore this query
 * runs on the same MySQL connection as the subsequent update.
 */
export async function getProfileByUserIdWithConnection(
  connection: PoolConnection,
  userId: number | string,
): Promise<ApplicantProfileRecord | null> {
  const [rows]: any = await connection.query(
    PROFILE_SELECT,
    [userId],
  );

  return rows?.[0] ? mapProfile(rows[0]) : null;
}

const PROFILE_COLUMNS = `
  user_id,

  profile_photo_path,
  salutation,
  applicant_name,
  employment_type,
  gender,
  date_of_birth,
  blood_group,
  mobile_no,
  personal_email,
  wii_official_email,

  address,
  city,
  state,
  pincode,

  designation,
  stream,
  course_name,

  department_cell_project,
  supervising_officer_id,
  supervising_officer_name,

  department_id,
  project_id,
  reporting_officer_id,
  reporting_manager_id,
  pi_user_id,
  batch_id,

  date_of_joining,
  valid_up_to,

  pan_no,
  bank_name,
  account_no,
  ifsc_code,

  office_order_file_name,
  biometric_id
`;

const PROFILE_UPDATE = `
  profile_photo_path = VALUES(profile_photo_path),
  salutation = VALUES(salutation),
  applicant_name = VALUES(applicant_name),
  employment_type = VALUES(employment_type),
  gender = VALUES(gender),
  date_of_birth = VALUES(date_of_birth),
  blood_group = VALUES(blood_group),
  mobile_no = VALUES(mobile_no),
  personal_email = VALUES(personal_email),
  wii_official_email = VALUES(wii_official_email),

  address = VALUES(address),
  city = VALUES(city),
  state = VALUES(state),
  pincode = VALUES(pincode),

  designation = VALUES(designation),
  stream = VALUES(stream),
  course_name = VALUES(course_name),

  department_cell_project = VALUES(department_cell_project),
  supervising_officer_id = VALUES(supervising_officer_id),
  supervising_officer_name = VALUES(supervising_officer_name),

  department_id = VALUES(department_id),
  project_id = VALUES(project_id),
  reporting_officer_id = VALUES(reporting_officer_id),
  reporting_manager_id = VALUES(reporting_manager_id),
  pi_user_id = VALUES(pi_user_id),
  batch_id = VALUES(batch_id),

  date_of_joining = VALUES(date_of_joining),
  valid_up_to = VALUES(valid_up_to),

  pan_no = VALUES(pan_no),
  bank_name = VALUES(bank_name),
  account_no = VALUES(account_no),
  ifsc_code = VALUES(ifsc_code),

  office_order_file_name = VALUES(office_order_file_name),
  biometric_id = VALUES(biometric_id)
`;

function profileValues(
  profile: ApplicantProfileRecord,
): unknown[] {
  return [
    profile.userId,

    profile.profilePhotoPath || null,
    profile.salutation || null,
    profile.applicantName,
    profile.employmentType || null,
    profile.gender || null,
    profile.dateOfBirth || null,
    profile.bloodGroup || null,
    profile.mobileNo,
    profile.personalEmail,
    profile.wiiOfficialEmail || null,

    profile.address || null,
    profile.city || null,
    profile.state || null,
    profile.pincode || null,

    profile.designation || null,
    profile.stream || null,
    profile.courseName || null,

    profile.departmentCellProject || null,
    profile.supervisingOfficerId || null,
    profile.supervisingOfficerName || null,

    profile.departmentId || null,
    profile.projectId || null,
    profile.reportingOfficerId || null,
    profile.reportingManagerId || null,
    profile.piUserId || null,
    profile.batchId || null,

    profile.dateOfJoining || null,
    profile.validUpTo || null,

    profile.panNo || null,
    profile.bankName || null,
    profile.accountNo || null,
    profile.ifscCode || null,

    profile.officeOrderFileName || null,
    profile.biometricId || null,
  ];
}

async function executeUpsert(
  executor: typeof db | PoolConnection,
  profile: ApplicantProfileRecord,
): Promise<void> {
  await executor.query(
    `
      INSERT INTO applicant_profiles (
        ${PROFILE_COLUMNS}
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
      ON DUPLICATE KEY UPDATE
        ${PROFILE_UPDATE}
    `,
    profileValues(profile),
  );
}

export async function upsertProfile(
  profile: ApplicantProfileRecord,
): Promise<ApplicantProfileRecord> {
  await executeUpsert(db, profile);

  const saved = await getProfileByUserId(
    profile.userId,
  );

  if (!saved) {
    throw new Error(
      "Unable to load saved applicant profile.",
    );
  }

  return saved;
}

/*
 * Transaction-aware profile write.
 *
 * This method intentionally does not COMMIT or ROLLBACK.
 * The service layer owns the transaction boundary.
 */
export async function upsertProfileWithConnection(
  connection: PoolConnection,
  profile: ApplicantProfileRecord,
): Promise<ApplicantProfileRecord> {
  await executeUpsert(connection, profile);

  const saved =
    await getProfileByUserIdWithConnection(
      connection,
      profile.userId,
    );

  if (!saved) {
    throw new Error(
      "Unable to load saved applicant profile.",
    );
  }

  return saved;
}
