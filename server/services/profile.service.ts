import type { PoolConnection } from "mysql2/promise";

import { db } from "../db/connection";

import {
  ApplicantProfileRecord,
  getProfileByUserId,
  getProfileByUserIdWithConnection,
  upsertProfileWithConnection,
} from "../repositories/profile.repository";

import { recordProfileChangeWithConnection } from "../repositories/profile-history.repository";

/* ============================================================
   EMPLOYMENT TYPES
   ============================================================ */

const EMPLOYMENT_TYPES = {
  PERMANENT: "Permanent",
  DEPUTATION: "Deputation",
  CONTRACTUAL: "Contractual",
  RESEARCHER_PROJECT_STAFF: "Researcher / Project Staff",
  MSC_STUDENT: "MSc Student",
  PHD_SCHOLAR: "PhD Scholar",
  DIPLOMA_TRAINEE: "Diploma Trainee",
  INTERN: "Intern",
} as const;

type EmploymentType =
  (typeof EMPLOYMENT_TYPES)[keyof typeof EMPLOYMENT_TYPES];

const BANK_ELIGIBLE_TYPES = new Set<EmploymentType>([
  EMPLOYMENT_TYPES.PERMANENT,
  EMPLOYMENT_TYPES.DEPUTATION,
  EMPLOYMENT_TYPES.CONTRACTUAL,
  EMPLOYMENT_TYPES.RESEARCHER_PROJECT_STAFF,
  EMPLOYMENT_TYPES.PHD_SCHOLAR,
]);

const NO_BANK_TYPES = new Set<EmploymentType>([
  EMPLOYMENT_TYPES.MSC_STUDENT,
  EMPLOYMENT_TYPES.DIPLOMA_TRAINEE,
  EMPLOYMENT_TYPES.INTERN,
]);

/* ============================================================
   BASIC VALIDATION HELPERS
   ============================================================ */

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

function requireString(
  value: unknown,
  fieldName: string,
): string {
  const valueClean = cleanString(value);

  if (!valueClean) {
    throw new Error(`${fieldName} is required.`);
  }

  return valueClean;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateDate(
  value: unknown,
  fieldName: string,
): string {
  const date = requireString(value, fieldName);

  if (!isValidDate(date)) {
    throw new Error(
      `${fieldName} must be a valid date.`,
    );
  }

  return date;
}

function validateEmail(
  value: unknown,
  fieldName: string,
): string {
  const email = requireString(value, fieldName)
    .toLowerCase();

  if (
    email.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error(
      `Enter a valid ${fieldName.toLowerCase()}.`,
    );
  }

  return email;
}

function validateMobile(value: unknown): string {
  const mobile = requireString(
    value,
    "Mobile Number",
  );

  if (!/^[0-9]{10,15}$/.test(mobile)) {
    throw new Error(
      "Enter a valid mobile number.",
    );
  }

  return mobile;
}

function validatePincode(
  value: unknown,
): string | null {
  const pincode = cleanString(value);

  if (!pincode) {
    return null;
  }

  if (!/^[0-9]{6}$/.test(pincode)) {
    throw new Error(
      "Enter a valid 6-digit PIN code.",
    );
  }

  return pincode;
}

function validatePAN(value: unknown): string {
  const pan = requireString(
    value,
    "PAN",
  ).toUpperCase();

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    throw new Error(
      "Enter a valid PAN number.",
    );
  }

  return pan;
}

function validateIFSC(value: unknown): string {
  const ifsc = requireString(
    value,
    "IFSC Code",
  ).toUpperCase();

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    throw new Error(
      "Enter a valid IFSC code.",
    );
  }

  return ifsc;
}

function validateAccountNumber(
  value: unknown,
): string {
  const account = requireString(
    value,
    "Account Number",
  );

  if (!/^[0-9]{6,30}$/.test(account)) {
    throw new Error(
      "Account Number must contain only digits and be 6 to 30 digits long.",
    );
  }

  return account;
}

function validateId(
  value: unknown,
  fieldName: string,
): number {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(`${fieldName} is required.`);
  }

  const id = Number(value);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      `${fieldName} is invalid.`,
    );
  }

  return id;
}

/* ============================================================
   DATE CALCULATION
   Permanent:
   last day of the month in which user turns 60.
   ============================================================ */

function calculatePermanentValidUpTo(
  dateOfBirth: string,
): string {
  const [year, month] = dateOfBirth
    .split("-")
    .map(Number);

  const sixtiethYear = year + 60;

  const lastDay = new Date(
    Date.UTC(
      sixtiethYear,
      month,
      0,
    ),
  );

  const resultYear =
    lastDay.getUTCFullYear();

  const resultMonth = String(
    lastDay.getUTCMonth() + 1,
  ).padStart(2, "0");

  const resultDay = String(
    lastDay.getUTCDate(),
  ).padStart(2, "0");

  return `${resultYear}-${resultMonth}-${resultDay}`;
}

function ensureValidUpToAfterJoining(
  dateOfJoining: string,
  validUpTo: string,
): void {
  if (
    validUpTo < dateOfJoining
  ) {
    throw new Error(
      "Valid Up To cannot be earlier than Date of Joining.",
    );
  }
}

/* ============================================================
   AUTHORITATIVE USER
   ============================================================ */

async function getAuthoritativeUser(
  userId: number | string,
) {
  const [rows]: any = await db.query(
    `
      SELECT
        id,
        full_name,
        email,
        phone,
        status
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId],
  );

  const user = rows?.[0];

  if (!user) {
    throw new Error(
      "Authenticated user could not be found.",
    );
  }

  if (user.status !== "active") {
    throw new Error(
      "User account is not active.",
    );
  }

  return user;
}

/* ============================================================
   EMPLOYMENT MASTER VALIDATION
   ============================================================ */

async function validateEmploymentType(
  employmentType: EmploymentType,
): Promise<number> {
  const [rows]: any = await db.query(
    `
      SELECT id
      FROM profile_employment_types
      WHERE display_name = ?
        AND status = 'active'
      LIMIT 1
    `,
    [employmentType],
  );

  if (!rows?.length) {
    throw new Error(
      "Selected Employment Type is not available.",
    );
  }
  return Number(rows[0].id);
}

/* ============================================================
   ORG MASTER VALIDATION
   ============================================================ */

async function getActiveOrgUnit(
  id: number | null,
  unitTypes: string[],
  fieldName: string,
): Promise<{
  id: number;
  unitName: string;
  unitType: string;
}> {
  if (id === null) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  const placeholders = unitTypes
    .map(() => "?")
    .join(", ");

  const [rows]: any = await db.query(
    `
      SELECT
        id,
        unit_name,
        unit_type
      FROM profile_org_units
      WHERE id = ?
        AND unit_type IN (${placeholders})
        AND status = 'active'
      LIMIT 1
    `,
    [id, ...unitTypes],
  );

  const row = rows?.[0];

  if (!row) {
    throw new Error(
      `Selected ${fieldName} is invalid.`,
    );
  }

  return {
    id: Number(row.id),
    unitName: String(row.unit_name),
    unitType: String(row.unit_type),
  };
}

/* ============================================================
   ACTIVE USER REFERENCE
   ============================================================ */

async function getActiveUserReference(
  id: number | null,
  fieldName: string,
): Promise<{
  id: number;
  fullName: string;
}> {
  if (id === null) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  const [rows]: any = await db.query(
    `
      SELECT
        id,
        full_name
      FROM users
      WHERE id = ?
        AND status = 'active'
      LIMIT 1
    `,
    [id],
  );

  const row = rows?.[0];

  if (!row) {
    throw new Error(
      `Selected ${fieldName} is invalid.`,
    );
  }

  return {
    id: Number(row.id),
    fullName: String(row.full_name),
  };
}

/* ============================================================
   BATCH VALIDATION
   ============================================================ */

async function validateBatch(batchId:number|null,employmentType:EmploymentType):Promise<void>{if(employmentType!==EMPLOYMENT_TYPES.MSC_STUDENT&&employmentType!==EMPLOYMENT_TYPES.DIPLOMA_TRAINEE){if(batchId!==null)throw new Error("Batch is not applicable for the selected Employment Type.");return;}if(batchId===null)throw new Error("Batch is required.");const table=employmentType===EMPLOYMENT_TYPES.MSC_STUDENT?"profile_msc_batches":"profile_trainee_batches";const [rows]:any=await db.query(`SELECT id FROM ${table} WHERE id=? AND status='active' LIMIT 1`,[batchId]);if(!rows?.length)throw new Error("Selected Batch is not available.");}

async function validateProfileMasterReferences(input:any,employmentType:EmploymentType,employmentTypeId:number){let designationId:number|null=null,streamId:number|null=null,courseId:number|null=null,mscBatchId:number|null=null,traineeBatchId:number|null=null,streamName:string|null=null,courseName:string|null=null;const needs=new Set<EmploymentType>([EMPLOYMENT_TYPES.PERMANENT,EMPLOYMENT_TYPES.DEPUTATION,EMPLOYMENT_TYPES.CONTRACTUAL,EMPLOYMENT_TYPES.RESEARCHER_PROJECT_STAFF]).has(employmentType);if(needs){designationId=validateId(input.designationId,"Designation");const [r]:any=await db.query(`SELECT id FROM profile_designation_masters WHERE id=? AND employment_type_id=? AND status='active' LIMIT 1`,[designationId,employmentTypeId]);if(!r?.length)throw new Error("Selected Designation is invalid for the selected Employment Type.");}if(employmentType===EMPLOYMENT_TYPES.MSC_STUDENT){streamId=validateId(input.streamId,"Stream");mscBatchId=validateId(input.mscBatchId??input.batchId,"MSc Batch");const [r]:any=await db.query(`SELECT stream_name FROM profile_stream_masters WHERE id=? AND status='active' LIMIT 1`,[streamId]);if(!r?.length)throw new Error("Selected Stream is invalid.");streamName=String(r[0].stream_name);const [b]:any=await db.query(`SELECT id FROM profile_msc_batches WHERE id=? AND stream_id=? AND status='active' LIMIT 1`,[mscBatchId,streamId]);if(!b?.length)throw new Error("Selected MSc Batch does not belong to the selected Stream.");}if(employmentType===EMPLOYMENT_TYPES.DIPLOMA_TRAINEE){courseId=validateId(input.courseId,"Course");traineeBatchId=validateId(input.traineeBatchId??input.batchId,"Trainee Batch");const [r]:any=await db.query(`SELECT course_name FROM profile_course_masters WHERE id=? AND status='active' LIMIT 1`,[courseId]);if(!r?.length)throw new Error("Selected Course is invalid.");courseName=String(r[0].course_name);const [b]:any=await db.query(`SELECT id FROM profile_trainee_batches WHERE id=? AND course_id=? AND status='active' LIMIT 1`,[traineeBatchId,courseId]);if(!b?.length)throw new Error("Selected Trainee Batch does not belong to the selected Course.");}return{designationId,streamId,courseId,mscBatchId,traineeBatchId,streamName,courseName};}

/* ============================================================
   BANK VALIDATION
   ============================================================ */

async function validateBankDetails(
  input: any,
  employmentType: EmploymentType,
): Promise<{
  panNo: string | null;
  bankName: string | null;
  accountNo: string | null;
  ifscCode: string | null;
}> {
  const pan = cleanString(input.panNo);
  const bank = cleanString(input.bankName);
  const account = cleanString(
    input.accountNo,
  );
  const ifsc = cleanString(input.ifscCode);

  if (NO_BANK_TYPES.has(employmentType)) {
    if (
      pan ||
      bank ||
      account ||
      ifsc
    ) {
      throw new Error(
        "Bank and identity details are not applicable for the selected Employment Type.",
      );
    }

    return {
      panNo: null,
      bankName: null,
      accountNo: null,
      ifscCode: null,
    };
  }

  if (!BANK_ELIGIBLE_TYPES.has(employmentType)) {
    throw new Error(
      "Invalid Employment Type.",
    );
  }

  const panNo = validatePAN(pan);
  const accountNo =
    validateAccountNumber(account);
  const ifscCode =
    validateIFSC(ifsc);
  const bankName =
    requireString(bank, "Bank");

  const [rows]: any = await db.query(
    `
      SELECT id
      FROM profile_bank_masters
      WHERE bank_name = ?
        AND status = 'active'
      LIMIT 1
    `,
    [bankName],
  );

  if (!rows?.length) {
    throw new Error(
      "Selected Bank is not available.",
    );
  }

  return {
    panNo,
    bankName,
    accountNo,
    ifscCode,
  };
}

/* ============================================================
   EMPLOYMENT-SPECIFIC VALIDATION
   ============================================================ */

async function validateEmploymentSpecificFields(
  input: any,
  employmentType: EmploymentType,
  dateOfBirth: string,
): Promise<{
  designation: string | null;
  stream: string | null;
  courseName: string | null;

  departmentId: number | null;
  projectId: number | null;

  reportingOfficerId: number | null;
  reportingManagerId: number | null;
  piUserId: number | null;

  batchId: number | null;

  departmentCellProject: string | null;
  supervisingOfficerName: string | null;

  dateOfJoining: string;
  validUpTo: string;
}> {
  const dateOfJoining = validateDate(
    input.dateOfJoining,
    "Date of Joining",
  );

  let designation: string | null = null;
  let stream: string | null = null;
  let courseName: string | null = null;

  let departmentId: number | null = null;
  let projectId: number | null = null;

  let reportingOfficerId: number | null = null;
  let reportingManagerId: number | null = null;
  let piUserId: number | null = null;

  let batchId: number | null = null;

  let departmentCellProject:
    | string
    | null = null;

  let supervisingOfficerName:
    | string
    | null = null;

  let validUpTo: string;

  switch (employmentType) {
    case EMPLOYMENT_TYPES.PERMANENT: {
      designation = requireString(
        input.designation,
        "Designation",
      );

      departmentId = validateId(
        input.departmentId,
        "Department / Cell",
      );

      reportingOfficerId =
        validateId(
          input.reportingOfficerId,
          "Reporting Officer",
        );

      const department =
        await getActiveOrgUnit(
          departmentId,
          ["department", "cell"],
          "Department / Cell",
        );

      const officer =
        await getActiveUserReference(
          reportingOfficerId,
          "Reporting Officer",
        );

      departmentCellProject =
        department.unitName;

      supervisingOfficerName =
        officer.fullName;

      validUpTo =
        calculatePermanentValidUpTo(
          dateOfBirth,
        );

      break;
    }

    case EMPLOYMENT_TYPES.DEPUTATION: {
      designation = requireString(
        input.designation,
        "Designation",
      );

      departmentId = validateId(
        input.departmentId,
        "Department / Cell",
      );

      reportingOfficerId =
        validateId(
          input.reportingOfficerId,
          "Reporting Officer",
        );

      const department =
        await getActiveOrgUnit(
          departmentId,
          ["department", "cell"],
          "Department / Cell",
        );

      const officer =
        await getActiveUserReference(
          reportingOfficerId,
          "Reporting Officer",
        );

      departmentCellProject =
        department.unitName;

      supervisingOfficerName =
        officer.fullName;

      validUpTo = validateDate(
        input.validUpTo,
        "Valid Up To",
      );

      break;
    }

    case EMPLOYMENT_TYPES.CONTRACTUAL: {
      designation = requireString(
        input.designation,
        "Designation",
      );

      projectId = validateId(
        input.projectId,
        "Project / Department / Cell",
      );

      reportingManagerId =
        validateId(
          input.reportingManagerId,
          "Reporting Manager / PI",
        );

      const unit =
        await getActiveOrgUnit(
          projectId,
          ["project", "department", "cell"],
          "Project / Department / Cell",
        );

      const manager =
        await getActiveUserReference(
          reportingManagerId,
          "Reporting Manager / PI",
        );

      departmentCellProject =
        unit.unitName;

      supervisingOfficerName =
        manager.fullName;

      validUpTo = validateDate(
        input.validUpTo,
        "Valid Up To",
      );

      break;
    }

    case EMPLOYMENT_TYPES.RESEARCHER_PROJECT_STAFF: {
      designation = requireString(
        input.designation,
        "Designation",
      );

      projectId = validateId(
        input.projectId,
        "Project",
      );

      piUserId = validateId(
        input.piUserId,
        "PI",
      );

      const project =
        await getActiveOrgUnit(
          projectId,
          ["project"],
          "Project",
        );

      const pi =
        await getActiveUserReference(
          piUserId,
          "PI",
        );

      departmentCellProject =
        project.unitName;

      supervisingOfficerName =
        pi.fullName;

      validUpTo = validateDate(
        input.validUpTo,
        "Valid Up To",
      );

      break;
    }

    case EMPLOYMENT_TYPES.PHD_SCHOLAR: {
      piUserId = validateId(
        input.piUserId,
        "PI",
      );

      const pi =
        await getActiveUserReference(
          piUserId,
          "PI",
        );

      supervisingOfficerName =
        pi.fullName;

      validUpTo = validateDate(
        input.validUpTo,
        "Valid Up To",
      );

      break;
    }

    case EMPLOYMENT_TYPES.MSC_STUDENT: {
      stream = requireString(
        input.stream,
        "Stream",
      );

      batchId = validateId(
        input.batchId,
        "Batch",
      );

      piUserId = validateId(
        input.piUserId,
        "PI",
      );

      await validateBatch(
        batchId,
        employmentType,
      );

      const pi =
        await getActiveUserReference(
          piUserId,
          "PI",
        );

      supervisingOfficerName =
        pi.fullName;

      validUpTo = validateDate(
        input.validUpTo,
        "Valid Up To",
      );

      break;
    }

    case EMPLOYMENT_TYPES.DIPLOMA_TRAINEE: {
      courseName = requireString(
        input.courseName,
        "Course Name",
      );

      batchId = validateId(
        input.batchId,
        "Batch",
      );

      piUserId = validateId(
        input.piUserId,
        "PI",
      );

      await validateBatch(
        batchId,
        employmentType,
      );

      const pi =
        await getActiveUserReference(
          piUserId,
          "PI",
        );

      supervisingOfficerName =
        pi.fullName;

      validUpTo = validateDate(
        input.validUpTo,
        "Valid Up To",
      );

      break;
    }

    case EMPLOYMENT_TYPES.INTERN: {
      piUserId = validateId(
        input.piUserId,
        "PI",
      );

      const pi =
        await getActiveUserReference(
          piUserId,
          "PI",
        );

      supervisingOfficerName =
        pi.fullName;

      validUpTo = validateDate(
        input.validUpTo,
        "Valid Up To",
      );

      break;
    }

    default:
      throw new Error(
        "Invalid Employment Type.",
      );
  }

  ensureValidUpToAfterJoining(
    dateOfJoining,
    validUpTo,
  );

  return {
    designation,
    stream,
    courseName,

    departmentId,
    projectId,

    reportingOfficerId,
    reportingManagerId,
    piUserId,

    batchId,

    departmentCellProject,
    supervisingOfficerName,

    dateOfJoining,
    validUpTo,
  };
}

/* ============================================================
   AUDIT
   ============================================================ */

const AUDIT_FIELDS = [
  "profilePhotoPath",
  "salutation",
  "applicantName",
  "employmentType",
  "gender",
  "dateOfBirth",
  "bloodGroup",
  "mobileNo",
  "personalEmail",
  "wiiOfficialEmail",
  "address",
  "city",
  "state",
  "pincode",
  "designation",
  "stream",
  "courseName",
  "departmentCellProject",
  "supervisingOfficerId",
  "supervisingOfficerName",
  "departmentId",
  "projectId",
  "reportingOfficerId",
  "reportingManagerId",
  "piUserId",
  "batchId",
  "dateOfJoining",
  "validUpTo",
  "panNo",
  "bankName",
  "accountNo",
  "ifscCode",
  "officeOrderFileName",
  "biometricId",
] as const;

type AuditField =
  (typeof AUDIT_FIELDS)[number];

const SENSITIVE_AUDIT_FIELDS =
  new Set<AuditField>([
    "panNo",
    "accountNo",
    "ifscCode",
  ]);

function maskSensitiveValue(
  field: AuditField,
  value: unknown,
): unknown {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text = String(value);

  if (
    !SENSITIVE_AUDIT_FIELDS.has(field)
  ) {
    return value;
  }

  if (field === "panNo") {
    if (text.length < 5) {
      return "***";
    }

    return `${text.slice(0, 2)}****${text.slice(-2)}`;
  }

  if (field === "accountNo") {
    if (text.length <= 4) {
      return "****";
    }

    return `****${text.slice(-4)}`;
  }

  if (field === "ifscCode") {
    if (text.length <= 4) {
      return "****";
    }

    return `${text.slice(0, 4)}****`;
  }

  return "***";
}

function auditProfile(
  profile: ApplicantProfileRecord,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of AUDIT_FIELDS) {
    result[field] = maskSensitiveValue(
      field,
      profile[field],
    );
  }

  return result;
}

function findChangedFields(
  oldProfile: ApplicantProfileRecord | null,
  newProfile: ApplicantProfileRecord,
): AuditField[] {
  const oldValues = oldProfile
    ? auditProfile(oldProfile)
    : {};

  const newValues =
    auditProfile(newProfile);

  return AUDIT_FIELDS.filter(
    (field) =>
      JSON.stringify(
        oldValues[field] ?? null,
      ) !==
      JSON.stringify(
        newValues[field] ?? null,
      ),
  );
}

/* ============================================================
   PUBLIC PROFILE READ
   ============================================================ */

export async function getApplicantProfile(
  userId: number | string,
) {
  await getAuthoritativeUser(userId);

  return getProfileByUserId(userId);
}

/* ============================================================
   PROFILE SAVE
   ============================================================ */

export async function saveApplicantProfile(
  userId: number | string,
  input: any,
  changedByUserId?: number | string,
  auditContext?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new Error(
      "Invalid profile data.",
    );
  }

  const authenticatedUser =
    await getAuthoritativeUser(userId);

  /*
   * ==========================================================
   * IMMUTABLE USER-OWNED IDENTITY
   * ==========================================================
   *
   * Normal profile updates cannot modify these fields.
   *
   * The users table is authoritative.
   */

  const authoritativeName =
    String(
      authenticatedUser.full_name || "",
    ).trim();

  const authoritativeMobile =
    validateMobile(
      authenticatedUser.phone,
    );

  const authoritativeEmail =
    validateEmail(
      authenticatedUser.email,
      "Personal Email",
    );

  if (
    input.applicantName !== undefined &&
    cleanString(input.applicantName) !==
      authoritativeName
  ) {
    throw new Error(
      "Full Name can only be changed by an authorized administrator.",
    );
  }

  if (
    input.mobileNo !== undefined &&
    cleanString(input.mobileNo) !==
      authoritativeMobile
  ) {
    throw new Error(
      "Mobile Number can only be changed by an authorized administrator.",
    );
  }

  if (
    input.personalEmail !== undefined &&
    cleanString(input.personalEmail)?.toLowerCase() !==
      authoritativeEmail
  ) {
    throw new Error(
      "Email can only be changed by an authorized administrator.",
    );
  }

  if (
    input.wiiOfficialEmail !== undefined &&
    cleanString(input.wiiOfficialEmail)?.toLowerCase() !==
      authoritativeEmail
  ) {
    throw new Error(
      "Official Email can only be changed by an authorized administrator.",
    );
  }

  /* ==========================================================
     COMMON PROFILE FIELDS
     ========================================================== */

  const employmentType =
    requireString(
      input.employmentType,
      "Employment Type",
    ) as EmploymentType;

  if (
    !Object.values(
      EMPLOYMENT_TYPES,
    ).includes(employmentType)
  ) {
    throw new Error(
      "Selected Employment Type is invalid.",
    );
  }

  const employmentTypeId=await validateEmploymentType(employmentType);

  const gender = requireString(
    input.gender,
    "Gender",
  );

  const dateOfBirth = validateDate(
    input.dateOfBirth,
    "Date of Birth",
  );

  const bloodGroup = requireString(
    input.bloodGroup,
    "Blood Group",
  );

  const pincode =
    validatePincode(input.pincode);

  /* ==========================================================
     EMPLOYMENT-SPECIFIC
     ========================================================== */

  const employmentFields =
    await validateEmploymentSpecificFields(
      input,
      employmentType,
      dateOfBirth,
    );

  const masterReferences=await validateProfileMasterReferences(input,employmentType,employmentTypeId);

  /* ==========================================================
     BANK
     ========================================================== */

  const bankDetails =
    await validateBankDetails(
      input,
      employmentType,
    );

  /* ==========================================================
     CONSTRUCT AUTHORITATIVE PROFILE
     ========================================================== */

  const profile: ApplicantProfileRecord = {
    userId,

    /*
     * Photo is currently a server-controlled reference.
     * A future upload endpoint will be responsible for
     * creating this value.
     */
    profilePhotoPath:
      cleanString(
        input.profilePhotoPath,
      ),

    salutation:
      cleanString(input.salutation),

    /*
     * NEVER trust these values from the client.
     */
    applicantName:
      authoritativeName,

    employmentType,
    employmentTypeId,

    gender,

    dateOfBirth,

    bloodGroup,

    mobileNo:
      authoritativeMobile,

    personalEmail:
      authoritativeEmail,

    wiiOfficialEmail:
      authoritativeEmail,

    address:
      cleanString(input.address),

    city:
      cleanString(input.city),

    state:
      cleanString(input.state),

    pincode,

    designation:
      employmentFields.designation,
    designationId: masterReferences.designationId,

    stream:
      masterReferences.streamName ?? employmentFields.stream,
    streamId: masterReferences.streamId,

    courseName:
      masterReferences.courseName ?? employmentFields.courseName,
    courseId: masterReferences.courseId,

    /*
     * This is derived from the selected master record.
     * Client supplied free text is ignored.
     */
    departmentCellProject:
      employmentFields.departmentCellProject,

    supervisingOfficerId:
      employmentFields.reportingOfficerId ??
      employmentFields.reportingManagerId ??
      employmentFields.piUserId ??
      null,

    supervisingOfficerName:
      employmentFields.supervisingOfficerName,

    departmentId:
      employmentFields.departmentId,

    projectId:
      employmentFields.projectId,

    organizationId: employmentFields.departmentId ?? employmentFields.projectId ?? null,

    reportingOfficerId:
      employmentFields.reportingOfficerId,

    reportingManagerId:
      employmentFields.reportingManagerId,

    piUserId:
      employmentFields.piUserId,

    batchId: masterReferences.mscBatchId ?? masterReferences.traineeBatchId ?? employmentFields.batchId,
    mscBatchId: masterReferences.mscBatchId,
    traineeBatchId: masterReferences.traineeBatchId,

    dateOfJoining:
      employmentFields.dateOfJoining,

    validUpTo:
      employmentFields.validUpTo,

    panNo:
      bankDetails.panNo,

    bankName:
      bankDetails.bankName,

    accountNo:
      bankDetails.accountNo,

    ifscCode:
      bankDetails.ifscCode,

    officeOrderFileName:
      cleanString(
        input.officeOrderFileName,
      ),

    biometricId:
      cleanString(
        input.biometricId,
      ),
  };

  /* ==========================================================
     TRANSACTION
     ========================================================== */

  const connection: PoolConnection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const oldProfile =
      await getProfileByUserIdWithConnection(
        connection,
        userId,
      );

    const savedProfile =
      await upsertProfileWithConnection(
        connection,
        profile,
      );

    const changedFields =
      findChangedFields(
        oldProfile,
        savedProfile,
      );

    /*
     * Only successful DB changes create history.
     *
     * CREATE is used for first profile creation.
     * UPDATE is used for normal self-service changes.
     * ADMIN_UPDATE will be used by the dedicated
     * administrator profile-update workflow.
     */
    if (changedFields.length > 0) {
      const oldAudit =
        oldProfile
          ? auditProfile(oldProfile)
          : null;

      const newAudit =
        auditProfile(savedProfile);

      const actorId = Number(
        changedByUserId ?? userId,
      );

      if (
        !Number.isSafeInteger(actorId) ||
        actorId <= 0
      ) {
        throw new Error(
          "Invalid audit actor.",
        );
      }

      await recordProfileChangeWithConnection(
        connection,
        {
          userId: Number(userId),
          changedByUserId: actorId,

          actionType:
            oldProfile
              ? "UPDATE"
              : "CREATE",

          changedFields:
            Object.fromEntries(
              changedFields.map(
                (field) => [
                  field,
                  true,
                ],
              ),
            ),

          oldValues:
            oldAudit,

          newValues:
            newAudit,

          ipAddress:
            auditContext?.ipAddress ??
            null,

          userAgent:
            auditContext?.userAgent ??
            null,
        },
      );
    }

    await connection.commit();

    return savedProfile;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
