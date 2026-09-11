/* ============================================================
   PROFILE DOMAIN TYPES
   ============================================================ */

export type ProfileEmploymentType =
  | "Permanent"
  | "Deputation"
  | "Contractual"
  | "Researcher / Project Staff"
  | "MSc Student"
  | "PhD Scholar"
  | "Diploma Trainee"
  | "Intern";

export type ProfileOrgUnitType = "department" | "cell" | "project";

export type ProfileBatchSeriesType = "msc" | "diploma_trainee";

/* ============================================================
   EMPLOYMENT TYPE MASTER
   ============================================================ */

export interface ProfileEmploymentTypeMaster {
  id: number;
  code: string;
  displayName: string;
}

/* ============================================================
   ORGANIZATION UNIT MASTER
   ============================================================ */

export interface ProfileOrgUnit {
  id: number;
  unitType: ProfileOrgUnitType;
  unitName: string;
  description: string | null;
}

/* ============================================================
   BANK MASTER
   ============================================================ */

export interface ProfileBank {
  id: number;
  bankName: string;
  bankCode: string | null;
}

/* ============================================================
   BATCH SERIES MASTER
   ============================================================ */

export interface ProfileBatchSeries {
  id: number;
  seriesType: ProfileBatchSeriesType;
  seriesName: string;
}

/* ============================================================
   BATCH MASTER
   ============================================================ */

export interface ProfileBatch {
  id: number;
  seriesId: number;
  seriesType: ProfileBatchSeriesType;
  batchNumber: number;
  batchLabel: string;
  startYear: number;
  endYear: number;
}

/* ============================================================
   OFFICER / MANAGER / PI MASTER
   ============================================================ */

export interface ProfileOfficer {
  id: number;
  fullName: string;
  email: string;
  roles: string[];
}

/* ============================================================
   APPLICANT PROFILE
   ============================================================ */

export interface ApplicantProfile {
  userId: number | string;

  profilePhotoPath: string | null;

  salutation: string | null;
  applicantName: string;

  employmentType: ProfileEmploymentType | "" | null;

  gender: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;

  mobileNo: string;
  personalEmail: string;
  wiiOfficialEmail: string | null;

  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;

  designation: string | null;
  stream: string | null;
  courseName: string | null;

  departmentCellProject: string | null;

  departmentId: number | null;
  projectId: number | null;

  supervisingOfficerId: number | null;
  supervisingOfficerName: string | null;

  reportingOfficerId: number | null;
  reportingManagerId: number | null;
  piUserId: number | null;

  batchId: number | null;

  dateOfJoining: string | null;
  validUpTo: string | null;

  panNo: string | null;
  bankName: string | null;
  accountNo: string | null;
  ifscCode: string | null;

  officeOrderFileName: string | null;
  biometricId: string | null;
}
