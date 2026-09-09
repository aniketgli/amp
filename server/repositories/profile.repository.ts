import { db } from "../db/connection";

export interface ApplicantProfileRecord {
  id?: number;
  userId: number | string;
  salutation?: string | null;
  applicantName: string;
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
  departmentCellProject?: string | null;
  supervisingOfficerId?: number | string | null;
  supervisingOfficerName?: string | null;
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
    salutation: row.salutation,
    applicantName: row.applicant_name,
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
    departmentCellProject: row.department_cell_project,
    supervisingOfficerId: row.supervising_officer_id,
    supervisingOfficerName: row.supervising_officer_name,
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

export async function getProfileByUserId(
  userId: number | string,
): Promise<ApplicantProfileRecord | null> {
  const [rows]: any = await db.query(
    `
      SELECT
        id,
        user_id,
        salutation,
        applicant_name,
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
        department_cell_project,
        supervising_officer_id,
        supervising_officer_name,
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
    `,
    [userId],
  );

  return rows?.[0] ? mapProfile(rows[0]) : null;
}

export async function upsertProfile(
  profile: ApplicantProfileRecord,
): Promise<ApplicantProfileRecord> {
  await db.query(
    `
      INSERT INTO applicant_profiles (
        user_id,
        salutation,
        applicant_name,
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
        department_cell_project,
        supervising_officer_id,
        supervising_officer_name,
        date_of_joining,
        valid_up_to,
        pan_no,
        bank_name,
        account_no,
        ifsc_code,
        office_order_file_name,
        biometric_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        salutation = VALUES(salutation),
        applicant_name = VALUES(applicant_name),
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
        department_cell_project = VALUES(department_cell_project),
        supervising_officer_id = VALUES(supervising_officer_id),
        supervising_officer_name = VALUES(supervising_officer_name),
        date_of_joining = VALUES(date_of_joining),
        valid_up_to = VALUES(valid_up_to),
        pan_no = VALUES(pan_no),
        bank_name = VALUES(bank_name),
        account_no = VALUES(account_no),
        ifsc_code = VALUES(ifsc_code),
        office_order_file_name = VALUES(office_order_file_name),
        biometric_id = VALUES(biometric_id)
    `,
    [
      profile.userId,
      profile.salutation || null,
      profile.applicantName,
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
      profile.departmentCellProject || null,
      profile.supervisingOfficerId || null,
      profile.supervisingOfficerName || null,
      profile.dateOfJoining || null,
      profile.validUpTo || null,
      profile.panNo || null,
      profile.bankName || null,
      profile.accountNo || null,
      profile.ifscCode || null,
      profile.officeOrderFileName || null,
      profile.biometricId || null,
    ],
  );

  const saved = await getProfileByUserId(profile.userId);

  if (!saved) {
    throw new Error("Unable to load saved applicant profile.");
  }

  return saved;
}
