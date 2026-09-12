/* ============================================================
   PROFILE DOMAIN TYPES
   ============================================================ */

export type ProfileEmploymentType = "Permanent" | "Deputation" | "Contractual" | "Researcher / Project Staff" | "MSc Student" | "PhD Scholar" | "Diploma Trainee" | "Intern";
export type ProfileOrgUnitType = "department" | "cell" | "project";
export type ProfileBatchSeriesType = "msc" | "diploma_trainee";
export type MasterStatus = "active" | "inactive";

export interface ProfileEmploymentTypeMaster { id:number; code:string; displayName:string; status:MasterStatus; }
export interface ProfileOrgUnit { id:number; unitType:ProfileOrgUnitType; unitName:string; unitCode:string; description:string|null; }
export interface ProfileBank { id:number; bankName:string; bankCode:string; }
export interface ProfileDesignation { id:number; employmentTypeId:number; employmentTypeCode:string; employmentTypeName:string; designationName:string; designationCode:string; }
export interface ProfileStream { id:number; streamName:string; streamCode:string; }
export interface ProfileMscBatch { id:number; streamId:number; streamName:string; streamCode:string; batchNumber:number; batchName:string; batchCode:string; validityStartYear:number; validityEndYear:number; }
export interface ProfileCourse { id:number; courseName:string; courseCode:string; }
export interface ProfileTraineeBatch { id:number; courseId:number; courseName:string; courseCode:string; batchNumber:number; batchName:string; batchCode:string; validityStartYear:number; validityEndYear:number; }
export interface ProfileBatchSeries { id:number; seriesType:ProfileBatchSeriesType; seriesName:string; }
export interface ProfileBatch { id:number; seriesId:number; seriesType:ProfileBatchSeriesType; batchNumber:number; batchLabel:string; startYear:number; endYear:number; }
export interface ProfileOfficer { id:number; fullName:string; email:string; roles:string[]; }

export interface ApplicantProfile {
  userId:number|string;
  profilePhotoPath:string|null;
  salutation:string|null;
  applicantName:string;
  employmentType:ProfileEmploymentType|""|null;
  employmentTypeId?:number|null;
  gender:string|null;
  dateOfBirth:string|null;
  bloodGroup:string|null;
  mobileNo:string;
  personalEmail:string;
  wiiOfficialEmail:string|null;
  address:string|null;
  city:string|null;
  state:string|null;
  pincode:string|null;
  designation:string|null;
  designationId?:number|null;
  stream:string|null;
  streamId?:number|null;
  courseName:string|null;
  courseId?:number|null;
  departmentCellProject:string|null;
  departmentId:number|null;
  projectId:number|null;
  organizationId?:number|null;
  supervisingOfficerId:number|null;
  supervisingOfficerName:string|null;
  reportingOfficerId:number|null;
  reportingManagerId:number|null;
  piUserId:number|null;
  batchId:number|null;
  mscBatchId?:number|null;
  traineeBatchId?:number|null;
  dateOfJoining:string|null;
  validUpTo:string|null;
  panNo:string|null;
  bankName:string|null;
  accountNo:string|null;
  ifscCode:string|null;
  officeOrderFileName:string|null;
  biometricId:string|null;
}
