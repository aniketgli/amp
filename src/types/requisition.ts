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
  requestedEmailPrefix?: string;
  requestInternet?: boolean;
  deviceType?: string;
  macAddress?: string;
  requestHrmsPms?: boolean;
  requestBiometric?: boolean;
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
  id: string;
  selectedServiceKey?: string;
  selectedRefId?: string;
  selectedServiceLabel?: string;
  serviceName?: string;
  formData?: Record<string, unknown>;
  type: RequisitionType;
  status: RequisitionStatus;
  applicant: ApplicantProfile;
  itHrmsDetails?: ITHrmsDetails;
  labAccessDetails?: LabFacilitySelection[];
  piApproval?: {
    status: 'pending' | 'approved' | 'rejected';
    officerName: string;
    comments?: string;
    timestamp?: string;
    signature?: string;
  };
  itCellVerification?: {
    emailNetOfficer?: { officerName: string; status: 'pending' | 'verified' | 'rejected'; comments?: string; timestamp?: string };
    hrmsOfficer?: { officerName: string; status: 'pending' | 'verified' | 'rejected'; comments?: string; timestamp?: string };
    biometricOfficer?: { officerName: string; status: 'pending' | 'verified' | 'rejected'; comments?: string; timestamp?: string };
  };
  sectionHeadApproval?: {
    status: 'pending' | 'approved' | 'rejected';
    officerName: string;
    comments?: string;
    timestamp?: string;
    signature?: string;
  };
  history: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
  applicant_id?: string;
  requisition_type?: RequisitionType;
  requisition_mode?: 'new' | 'renewal';
  renewal_reason?: string;
  remarks?: string;
}
