export type UserRole =
  | 'applicant'
  | 'supervisor'
  | 'it_officer'
  | 'hrms_officer'
  | 'lab_nodal'
  | 'assoc_lab_nodal'
  | 'section_head'
  | 'admin'
  | 'super_admin';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  role: UserRole;
  intercom?: string;
  status: 'active' | 'suspended' | 'locked';
  permissions: string[];
  lastActive: string;
}

export interface RoleInfo {
  id: UserRole;
  name: string;
  title: string;
  department: string;
  intercom?: string;
  avatarColor: string;
}

export type RequisitionType = 'IT_HRMS' | 'LAB_FACILITY' | 'COMBINED';

export type RequisitionStatus =
  | 'draft'
  | 'submitted_pending_pi'
  | 'pi_approved'
  | 'in_tech_verification'
  | 'in_lab_review'
  | 'pending_section_head'
  | 'approved_provisioned'
  | 'rejected'
  | 'deactivated';

export interface ApplicantProfile {
  profilePhotoUrl?: string;
  salutation?: string;
  applicantName: string;
  employmentType?: 'Intern' | 'Project employee' | 'Permanent' | 'Trainee' | 'Student' | string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  mobileNo: string;
  personalEmail: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bankName?: string;
  ifscCode?: string;
  accountNo?: string;
  accountNoBank: string;
  panNo: string;
  designation: string;
  dateOfJoining: string;
  numberOfLeavesPerYear?: string;
  validUpTo: string;
  departmentCellProject: string;
  supervisingOfficerName: string;
  officeOrderFileName?: string;
  officeOrderVerification?: OfficeOrderVerificationResult;
  verifiedOfficeOrderLogs?: OfficeOrderLogEntry[];
  biometricId?: string;
}

export interface OfficeOrderLogEntry {
  id: string;
  orderNumber: string;
  orderDate: string;
  fileName: string;
  designation: string;
  departmentCellProject: string;
  supervisingOfficerName: string;
  validFrom: string;
  validUpTo: string;
  verifiedAt: string;
  verifiedBy: string;
  status: 'active' | 'archived' | 'superseded';
  monthlyEmoluments?: string;
  verificationConfidence?: string;
  extractedTextSummary?: string;
}

export interface DocumentComparisonItem {
  field: string;
  label: string;
  formValue: string;
  docValue: string;
  isMatch: boolean;
  mismatchMessage?: string;
}

export interface OfficeOrderVerificationResult {
  verifiedAt: string;
  status: 'verified' | 'mismatch' | 'error';
  fileName: string;
  extractedData: {
    applicantName?: string;
    orderNumber?: string;
    orderDate?: string;
    designation?: string;
    departmentCellProject?: string;
    supervisingOfficerName?: string;
    dateOfJoining?: string;
    validUpTo?: string;
    employmentType?: string;
    monthlyEmoluments?: string;
    extractedTextSummary?: string;
  };
  comparisons: DocumentComparisonItem[];
  hasMismatches: boolean;
  mismatchCount: number;
  mismatchesSummary?: string[];
  overallConfidence?: string;
}

export interface ITHrmsDetails {
  requisitionMode?: 'new' | 'renewal';
  renewalReason?: string;
  requestEmail?: boolean;
  requestedEmailGroups?: string[];
  requestInternet?: boolean;
  deviceType?: string;
  macAddress?: string;
  requestHrmsPms?: boolean;
  requestBiometric?: boolean;
  
  // Provisioned technical data
  assignedWiiEmail?: string;
  assignedEmailGroups?: string[];
  assignedEmailPassword?: string;
  verifiedMacAddress?: string;
  wifiAccessKey?: string;
  assignedBiometricId?: string;
  biometricPin?: string;
  hrmsAccessGranted?: boolean;
  assignedHrmsEmpCode?: string;
  hrmsPassword?: string;
}

export interface LabFacilitySelection {
  labId: string;
  labName: string;
  selected: boolean;
  purposeEquipment: string;
  fromDate: string;
  toDate: string;
  hasBiometricId?: boolean;
  biometricIdNumber?: string;
  assignedLabPassId?: string;
  nodalApprovalStatus: 'pending' | 'approved' | 'rejected';
  nodalComments?: string;
  nodalOfficerName?: string;
  actionDate?: string;
}

export interface FacilityMasterItem {
  id: string;
  name: string;
  nodal: string;
  assocNodal: string;
  supervisor: string;
  status: 'active' | 'inactive';
  dept?: string;
  desc?: string;
}

export interface ServiceMasterItem {
  id: string;
  name: string;
  manager: string;
  quota: string;
  status: 'active' | 'inactive';
}

export const WII_LABS = [
  { id: 'analytical', name: 'Analytical Lab', defaultNodal: 'Dr. S. K. Gupta' },
  { id: 'computer', name: 'Computer Lab', defaultNodal: 'Mr. Dinesh Singh Pundir' },
  { id: 'forensic', name: 'Forensic Lab', defaultNodal: 'Dr. S. P. Goyal' },
  { id: 'gis', name: 'GIS Lab', defaultNodal: 'Dr. K. Ramesh' },
  { id: 'microscopy', name: 'Microscopy & Research Facility', defaultNodal: 'Dr. B. S. Adhikari' },
  { id: 'non_invasive', name: 'Non-Invasive Research Facility', defaultNodal: 'Dr. Samrat Mondol' },
  { id: 'teaching_repository', name: 'Teaching / Training Facility and National Wildlife Repository', defaultNodal: 'Dr. J. A. Johnson' },
  { id: 'endocrinology', name: 'Wildlife Endocrinology Lab', defaultNodal: 'Dr. Parag Nigam' },
  { id: 'conservation_genetics', name: 'Conservation Genetics Facility', defaultNodal: 'Dr. S. A. Hussain' },
];

export interface WorkflowAction {
  id: string;
  actorRole: UserRole;
  actorName: string;
  actionType: 'submit' | 'pi_approve' | 'pi_reject' | 'tech_provision' | 'lab_approve' | 'lab_reject' | 'section_head_authorize' | 'reject' | 'deactivate';
  comments?: string;
  timestamp: string;
  digitalSignature?: string;
}

export interface RequisitionRecord {
  id: string; // e.g. WII/2026/0101
  selectedServiceKey?: string; // e.g. 'email', 'internet', 'hrms', 'biometric', 'lab-...'
  selectedRefId?: string; // e.g. 'WII/2026/0101-EML'
  selectedServiceLabel?: string; // e.g. 'Official WII Email ID'
  serviceName?: string; // Optional specific service title
  type: RequisitionType;
  status: RequisitionStatus;
  applicant: ApplicantProfile;
  itHrmsDetails?: ITHrmsDetails;
  labAccessDetails?: LabFacilitySelection[];
  
  // Approvals breakdown
  piApproval?: {
    status: 'pending' | 'approved' | 'rejected';
    officerName: string;
    comments?: string;
    timestamp?: string;
    signature?: string;
  };

  itCellVerification?: {
    emailNetOfficer?: {
      officerName: string; // Dinesh Singh Pundir
      status: 'pending' | 'verified' | 'rejected';
      comments?: string;
      timestamp?: string;
    };
    hrmsOfficer?: {
      officerName: string; // Harendra Kumar
      status: 'pending' | 'verified' | 'rejected';
      comments?: string;
      timestamp?: string;
    };
    biometricOfficer?: {
      officerName: string; // Aniket Gupta
      status: 'pending' | 'verified' | 'rejected';
      comments?: string;
      timestamp?: string;
    };
  };

  sectionHeadApproval?: {
    status: 'pending' | 'approved' | 'rejected';
    officerName: string; // Dr. Panna Lal
    comments?: string;
    timestamp?: string;
    signature?: string;
  };

  history: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
}

export type SecurityAuditActionType =
  | 'PROFILE_UPDATE'
  | 'OFFICE_ORDER_UPLOAD'
  | 'REQUISITION_SUBMIT'
  | 'PI_APPROVAL'
  | 'PI_REJECTION'
  | 'IT_EMAIL_PROVISION'
  | 'IT_WIFI_BINDING'
  | 'HRMS_PORTAL_GRANT'
  | 'BIOMETRIC_ENROLL'
  | 'LAB_SLOT_APPROVAL'
  | 'SECTION_HEAD_AUTHORIZATION'
  | 'ROLE_CHANGE'
  | 'USER_STATUS_TOGGLE'
  | 'USER_CREATE'
  | 'FACILITY_MASTER_EDIT'
  | 'SERVICE_MASTER_EDIT'
  | 'SYSTEM_CONFIG_CHANGE'
  | 'LOGIN_SUCCESS'
  | 'PASSWORD_RESET';

export interface SecurityAuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  actorRoleLabel?: string;
  actionType: SecurityAuditActionType;
  module: string; // Kaha (Module/Entity)
  summary: string; // Kya (Summary of Action)
  details?: {
    previousValue?: string;
    newValue?: string;
    targetEntity?: string;
    ipAddress?: string;
    digitalSignature?: string;
    comments?: string;
  };
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}
