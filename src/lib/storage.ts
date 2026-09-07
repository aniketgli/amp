import { INITIAL_REQUISITIONS } from '../data/initialData';
import {
  ApplicantProfile,
  FacilityMasterItem,
  RequisitionRecord,
  RequisitionStatus,
  ServiceMasterItem,
  UserRole,
  WorkflowAction,
} from '../types/requisition';

const STORAGE_KEY_REQUISITIONS = 'wii_requisitions_v1';
const STORAGE_KEY_PROFILE = 'wii_applicant_profile_v1';
const STORAGE_KEY_FACILITIES = 'wii_facilities_master_v1';
const STORAGE_KEY_SERVICES = 'wii_services_master_v1';

export const DEFAULT_FACILITIES_MASTER: FacilityMasterItem[] = [
  {
    id: 'FAC-01',
    name: 'Microscopy & Research Facility',
    nodal: 'Dr. B. S. Adhikari',
    assocNodal: 'Dr. Neha Verma',
    supervisor: 'Er. Vikas Mehta',
    status: 'active',
    dept: 'Habitat Ecology',
    desc: 'Stereo Zoom Microscopes, Digital Imaging Suite & Specimen Slides',
  },
  {
    id: 'FAC-02',
    name: 'Non-Invasive Research Facility',
    nodal: 'Dr. Samrat Mondol',
    assocNodal: 'Dr. Anupama Mukherjee',
    supervisor: 'Mr. Dinesh Singh Pundir',
    status: 'active',
    dept: 'Genetics Cell',
    desc: 'Real-Time PCR, NGS Analysis, Non-Invasive Fecal DNA Extraction',
  },
  {
    id: 'FAC-03',
    name: 'Teaching & Training Facility',
    nodal: 'Dr. J. A. Johnson',
    assocNodal: 'Dr. Yash Veer Bhatnagar',
    supervisor: 'Dr. S. K. Gupta',
    status: 'active',
    dept: 'Training Wing',
    desc: 'Audio-visual seminar hall, interactive research stations',
  },
  {
    id: 'FAC-04',
    name: 'National Wildlife Repository',
    nodal: 'Dr. S. A. Hussain',
    assocNodal: 'Dr. Navaneethan S.',
    supervisor: 'Dr. Parag Nigam',
    status: 'active',
    dept: 'Repository & Museum',
    desc: 'Botanical Herbarium Preservation, Plant Taxonomy & Digital Archives',
  },
  {
    id: 'FAC-05',
    name: 'GIS & Remote Sensing Spatial Facility',
    nodal: 'Dr. K. Ramesh',
    assocNodal: 'Dr. G. S. Rawat',
    supervisor: 'Dr. S. P. Goyal',
    status: 'active',
    dept: 'RS & GIS Cell',
    desc: 'ArcGIS Pro, QGIS, High-performance Workstations & Satellite Datasets',
  },
  {
    id: 'FAC-06',
    name: 'Wildlife Forensic Laboratory',
    nodal: 'Dr. S. P. Goyal',
    assocNodal: 'Dr. Samrat Mondol',
    supervisor: 'Dr. Parag Nigam',
    status: 'active',
    dept: 'Forensic Wing',
    desc: 'DNA Sequencer, STR Profiling, Illegal Wildlife Specimen Identification',
  },
  {
    id: 'FAC-07',
    name: 'Analytical & Spectrophotometry Lab',
    nodal: 'Dr. S. K. Gupta',
    assocNodal: 'Dr. B. S. Adhikari',
    supervisor: 'Dr. K. Ramesh',
    status: 'active',
    dept: 'Ecology Wing',
    desc: 'Atomic Absorption, HPLC, UV-Vis Spectrophotometer & Soil Analysis',
  },
  {
    id: 'FAC-08',
    name: 'Wildlife Health & Eco-Toxicology Lab',
    nodal: 'Dr. Parag Nigam',
    assocNodal: 'Dr. S. A. Hussain',
    supervisor: 'Dr. J. A. Johnson',
    status: 'active',
    dept: 'Health Cell',
    desc: 'Pathology Equipment, Chemical Residue Analysis & Disease Surveillance',
  },
  {
    id: 'FAC-09',
    name: 'Drone / UAV & Spatial Modelling Suite',
    nodal: 'Dr. K. Ramesh',
    assocNodal: 'Dr. G. S. Rawat',
    supervisor: 'Er. Vikas Mehta',
    status: 'active',
    dept: 'Geomatics Cell',
    desc: 'Thermal Drone Processing, LiDAR Spatial Point Clouds & Flight Logs',
  },
];

export const DEFAULT_SERVICES_MASTER: ServiceMasterItem[] = [
  { id: 'SRV-01', name: 'Institutional Webmail (@wii.gov.in)', manager: 'Mr. Dinesh Singh Pundir', quota: '10 GB / user', status: 'active' },
  { id: 'SRV-02', name: 'Campus Wi-Fi Hardware MAC Binding', manager: 'Er. Vikas Mehta', quota: '3 Devices / user', status: 'active' },
  { id: 'SRV-03', name: 'Biometric Attendance Registration', manager: 'Mr. Dinesh Singh Pundir', quota: 'Single Profile Access', status: 'active' },
  { id: 'SRV-04', name: 'HRMS & PMS Portal Account Provisioning', manager: 'Dr. Yash Veer Bhatnagar', quota: 'Official Staff Access', status: 'active' },
  { id: 'SRV-05', name: 'High-Performance Computing Cluster (HPC)', manager: 'Dr. K. Ramesh', quota: '64 Cores / 128GB RAM', status: 'active' },
  { id: 'SRV-06', name: 'Audio-Visual Conference Room Booking', manager: 'Dr. J. A. Johnson', quota: 'Slot Basis', status: 'active' },
];

export const getStoredFacilities = (): FacilityMasterItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FACILITIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(DEFAULT_FACILITIES_MASTER));
      return DEFAULT_FACILITIES_MASTER;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(DEFAULT_FACILITIES_MASTER));
      return DEFAULT_FACILITIES_MASTER;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load facilities master from storage', e);
    return DEFAULT_FACILITIES_MASTER;
  }
};

export const saveFacilities = (facilities: FacilityMasterItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(facilities));
    window.dispatchEvent(new CustomEvent('wii_masters_updated', { detail: { type: 'facilities', facilities } }));
  } catch (e) {
    console.error('Failed to save facilities master', e);
  }
};

export const getStoredServices = (): ServiceMasterItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SERVICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(DEFAULT_SERVICES_MASTER));
      return DEFAULT_SERVICES_MASTER;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(DEFAULT_SERVICES_MASTER));
      return DEFAULT_SERVICES_MASTER;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load services master from storage', e);
    return DEFAULT_SERVICES_MASTER;
  }
};

export const saveServices = (services: ServiceMasterItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
    window.dispatchEvent(new CustomEvent('wii_masters_updated', { detail: { type: 'services', services } }));
  } catch (e) {
    console.error('Failed to save services master', e);
  }
};

export const findFacility = (idOrNameOrAlias?: string, facilities?: FacilityMasterItem[]): FacilityMasterItem | undefined => {
  if (!idOrNameOrAlias) return undefined;
  const list = facilities || getStoredFacilities();
  const query = idOrNameOrAlias.trim().toLowerCase();

  // 1. Exact ID match
  let found = list.find((f) => f.id.toLowerCase() === query);
  if (found) return found;

  // 2. Exact Name match
  found = list.find((f) => f.name.toLowerCase() === query);
  if (found) return found;

  // 3. Known aliases map to standard full names
  const aliasMap: Record<string, string> = {
    gis: 'GIS & Remote Sensing Spatial Facility',
    forensic: 'Wildlife Forensic Laboratory',
    analytical: 'Analytical & Spectrophotometry Lab',
    microscopy: 'Microscopy & Research Facility',
    non_invasive: 'Non-Invasive Research Facility',
    teaching_repository: 'Teaching & Training Facility',
    teaching: 'Teaching & Training Facility',
    repository: 'National Wildlife Repository',
    health_toxicology: 'Wildlife Health & Eco-Toxicology Lab',
    conservation_genetics: 'Non-Invasive Research Facility',
    uav_remote_sensing: 'Drone / UAV & Spatial Modelling Suite',
    herbarium: 'National Wildlife Repository',
    bioinformatics: 'High-Performance Computing Cluster',
  };

  const mappedName = aliasMap[query];
  if (mappedName) {
    found = list.find((f) => f.name.toLowerCase().includes(mappedName.toLowerCase()) || mappedName.toLowerCase().includes(f.name.toLowerCase()));
    if (found) return found;
  }

  // 4. Substring search
  found = list.find((f) => f.name.toLowerCase().includes(query) || query.includes(f.name.toLowerCase()));
  return found;
};

export const getStoredRequisitions = (): RequisitionRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUISITIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REQUISITIONS, JSON.stringify(INITIAL_REQUISITIONS));
      return INITIAL_REQUISITIONS;
    }
    const parsed = JSON.parse(raw);
    // If stored items contain old dummy IDs or empty array, populate with INITIAL_REQUISITIONS
    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      parsed.some((r: any) => r.id && r.id.startsWith('WII-REQ'))
    ) {
      localStorage.setItem(STORAGE_KEY_REQUISITIONS, JSON.stringify(INITIAL_REQUISITIONS));
      return INITIAL_REQUISITIONS;
    }

    // Deduplicate by ID to prevent duplicate key errors if corrupted state exists
    const seen = new Set<string>();
    const uniqueRecords: RequisitionRecord[] = [];
    for (const item of parsed) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        uniqueRecords.push(item);
      }
    }

    // Automatically incorporate any newly added INITIAL_REQUISITIONS records (e.g. renewal dummy cases)
    let addedNewInitial = false;
    for (const initReq of INITIAL_REQUISITIONS) {
      if (!seen.has(initReq.id)) {
        seen.add(initReq.id);
        uniqueRecords.push(initReq);
        addedNewInitial = true;
      }
    }

    if (uniqueRecords.length !== parsed.length || addedNewInitial) {
      localStorage.setItem(STORAGE_KEY_REQUISITIONS, JSON.stringify(uniqueRecords));
    }

    return uniqueRecords.length > 0 ? uniqueRecords : INITIAL_REQUISITIONS;
  } catch (e) {
    console.error('Failed to load requisitions from localStorage', e);
    return INITIAL_REQUISITIONS;
  }
};

export const resetToDefaultRequisitions = (): RequisitionRecord[] => {
  try {
    localStorage.setItem(STORAGE_KEY_REQUISITIONS, JSON.stringify(INITIAL_REQUISITIONS));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wii_masters_updated'));
    }
  } catch (e) {
    console.error('Failed to reset default requisitions', e);
  }
  return INITIAL_REQUISITIONS;
};

export const generateRequisitionId = (records?: RequisitionRecord[]): string => {
  const current = records || getStoredRequisitions();
  const year = new Date().getFullYear();
  let maxSeq = 100;

  current.forEach((r) => {
    if (r.id) {
      const parts = r.id.split('/');
      if (parts.length === 3 && parts[0] === 'WII') {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      } else {
        const dashParts = r.id.split('-');
        if (dashParts.length >= 3) {
          const num = parseInt(dashParts[dashParts.length - 1], 10);
          if (!isNaN(num) && num < 9999 && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `WII/${year}/${nextSeq}`;
};

export const getRequisitionRefId = (req: RequisitionRecord): string => {
  if (req.selectedRefId) {
    return req.selectedRefId;
  }

  if (req.selectedServiceKey) {
    if (req.selectedServiceKey === 'email') return `${req.id}-EML`;
    if (req.selectedServiceKey === 'internet') return `${req.id}-NET`;
    if (req.selectedServiceKey === 'hrms') return `${req.id}-HRM`;
    if (req.selectedServiceKey === 'biometric') return `${req.id}-BIO`;
    if (req.selectedServiceKey.startsWith('lab-')) {
      const labCode = req.selectedServiceKey.replace('lab-', '').substring(0, 3).toUpperCase();
      return `${req.id}-LAB-${labCode}`;
    }
  }

  if (req.type === 'IT_HRMS' && req.itHrmsDetails) {
    const details = req.itHrmsDetails;
    const activeCount =
      (details.requestEmail ? 1 : 0) +
      (details.requestInternet ? 1 : 0) +
      (details.requestHrmsPms ? 1 : 0) +
      (details.requestBiometric ? 1 : 0);

    if (activeCount === 1) {
      if (details.requestEmail) return `${req.id}-EML`;
      if (details.requestInternet) return `${req.id}-NET`;
      if (details.requestHrmsPms) return `${req.id}-HRM`;
      if (details.requestBiometric) return `${req.id}-BIO`;
    }
  }

  if (req.type === 'LAB_FACILITY' && req.labAccessDetails) {
    const selected = req.labAccessDetails.filter((l) => l.selected);
    if (selected.length === 1) {
      const labCode = selected[0].labId.substring(0, 3).toUpperCase();
      return `${req.id}-LAB-${labCode}`;
    }
  }

  return req.id;
};

export const getRequisitionServiceName = (req: RequisitionRecord): string => {
  if (req.selectedServiceLabel) {
    let label = req.selectedServiceLabel.replace(/\s*Requisition$/i, '').replace(/\s*Access$/i, '');
    return `${label} Access`;
  }

  if (req.selectedServiceKey) {
    if (req.selectedServiceKey === 'email') return 'Official WII Email Access';
    if (req.selectedServiceKey === 'internet') return 'Campus Wi-Fi / Internet Access';
    if (req.selectedServiceKey === 'hrms') return 'HRMS / PMS Portal Access';
    if (req.selectedServiceKey === 'biometric') return 'Biometric Attendance Access';
    if (req.selectedServiceKey.startsWith('lab-')) {
      const labId = req.selectedServiceKey.replace('lab-', '');
      const lab = req.labAccessDetails?.find((l) => l.labId === labId);
      if (lab) return `${lab.labName} Access`;
    }
  }

  if (req.serviceName) {
    return req.serviceName.replace(/\s*Requisition$/i, ' Access');
  }

  if (req.type === 'LAB_FACILITY') {
    if (req.labAccessDetails && req.labAccessDetails.length > 0) {
      const selected = req.labAccessDetails.filter((l) => l.selected);
      if (selected.length === 1) {
        return `${selected[0].labName} Access`;
      } else if (selected.length > 1) {
        return `Research Lab Access`;
      }
    }
    return 'Analytical Lab Access';
  }

  if (req.type === 'IT_HRMS') {
    const details = req.itHrmsDetails;
    if (details) {
      const services: string[] = [];
      if (details.requestEmail) services.push('Official WII Email');
      if (details.requestInternet) services.push('Campus Wi-Fi / MAC');
      if (details.requestHrmsPms) services.push('HRMS Portal');
      if (details.requestBiometric) services.push('Biometric Attendance');

      if (services.length === 1) {
        return `${services[0]} Access`;
      } else if (services.length > 1) {
        return 'IT & HRMS Access';
      }
    }
    return 'IT & HRMS Access';
  }

  if (req.type === 'COMBINED') {
    return 'Integrated IT & Research Lab Services Access';
  }

  return 'WII Official Service Access';
};

/**
 * Workflow visibility helper: An access request is visible to an officer role
 * ONLY IF it has been forwarded to their stage or beyond according to the workflow chain.
 */
export const isRequisitionVisibleForRole = (req: RequisitionRecord, role: UserRole): boolean => {
  // Master Admin & Super Admin see all access requests
  if (role === 'admin' || role === 'super_admin') {
    return true;
  }

  // Applicant sees their own access requests
  if (role === 'applicant') {
    return true;
  }

  // Supervisor (PI): Sees requests submitted to PI or endorsed by PI (Stage 1 and beyond)
  if (role === 'supervisor') {
    return true;
  }

  // Lab Nodal / Associate Lab Nodal Officer:
  // ONLY sees access requests that have ALREADY BEEN FORWARDED to Lab Review stage (in_lab_review) or beyond!
  if (role === 'lab_nodal' || role === 'assoc_lab_nodal') {
    if (req.status === 'submitted_pending_pi') {
      return false; // Request has NOT been forwarded by PI to Lab Nodal yet!
    }

    const hasLab =
      req.type === 'LAB_FACILITY' ||
      (req.type === 'COMBINED' && Boolean(req.labAccessDetails && req.labAccessDetails.some((l) => l.selected)));

    if (!hasLab) return false;

    if (req.status === 'rejected' && !req.labAccessDetails?.some((l) => l.nodalApprovalStatus !== 'pending')) {
      return false;
    }

    return true;
  }

  // Section Head IT:
  // ONLY sees access requests that have ALREADY BEEN FORWARDED to Section Head stage (pending_section_head) or beyond!
  if (role === 'section_head') {
    if (req.status === 'submitted_pending_pi' || req.status === 'in_lab_review') {
      return false; // Request has NOT been forwarded to Section Head yet!
    }

    if (req.status === 'rejected' && !req.sectionHeadApproval) {
      return false;
    }

    return true;
  }

  // Technical IT Officer:
  // ONLY sees access requests that have ALREADY BEEN FORWARDED to Technical Verification stage (in_tech_verification) or beyond!
  if (role === 'it_officer') {
    if (
      req.status === 'submitted_pending_pi' ||
      req.status === 'in_lab_review' ||
      req.status === 'pending_section_head'
    ) {
      return false; // Request has NOT been forwarded to Technical Verification stage yet!
    }

    const hasIT = req.type === 'IT_HRMS' || req.type === 'COMBINED';
    if (!hasIT) return false;

    if (req.status === 'rejected' && !req.itCellVerification?.emailNetOfficer) {
      return false;
    }

    return true;
  }

  // HRMS Officer:
  // ONLY sees access requests that have ALREADY BEEN FORWARDED to Technical Verification stage (in_tech_verification) or beyond!
  if (role === 'hrms_officer') {
    if (
      req.status === 'submitted_pending_pi' ||
      req.status === 'in_lab_review' ||
      req.status === 'pending_section_head'
    ) {
      return false; // Request has NOT been forwarded to HRMS stage yet!
    }

    const hasHrms =
      (req.type === 'IT_HRMS' || req.type === 'COMBINED') &&
      Boolean(req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric);

    if (!hasHrms) return false;

    if (req.status === 'rejected' && !req.itCellVerification?.hrmsOfficer) {
      return false;
    }

    return true;
  }

  return true;
};

export const saveRequisitions = (records: RequisitionRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_REQUISITIONS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save requisitions to localStorage', e);
  }
};

export const getSavedApplicantProfile = (): ApplicantProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load saved profile', e);
  }

  // Default initial profile template
  return {
    profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    salutation: 'Dr.',
    applicantName: 'Ananya Sharma',
    gender: 'Female',
    dateOfBirth: '1996-08-12',
    bloodGroup: 'A+',
    mobileNo: '+91 98765 12345',
    personalEmail: 'ananya.sharma@wii.gov.in',
    address: 'WII Campus Quarters, Chandrabani',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248001',
    bankName: 'HDFC Bank (Dehradun Main Branch)',
    accountNo: '50100234192',
    accountNoBank: '50100234192 (HDFC Bank Dehradun)',
    panNo: 'ASHPR1928K',
    designation: 'Senior Research Fellow',
    dateOfJoining: '2026-02-01',
    numberOfLeavesPerYear: '15',
    validUpTo: '2028-01-31',
    departmentCellProject: 'Department of Landscape Level Planning & GIS',
    supervisingOfficerName: 'Dr. R. K. Singh',
    officeOrderFileName: 'WII_Office_Order_Engagement_2026.pdf',
    biometricId: 'WII-BIO-1088',
  };
};

export const saveApplicantProfile = (profile: ApplicantProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
};

export const resetToInitialData = (): RequisitionRecord[] => {
  localStorage.setItem(STORAGE_KEY_REQUISITIONS, JSON.stringify(INITIAL_REQUISITIONS));
  return INITIAL_REQUISITIONS;
};

export const createNewRequisition = (record: RequisitionRecord): RequisitionRecord[] => {
  const current = getStoredRequisitions();
  const updated = [record, ...current.filter((r) => r.id !== record.id)];
  saveRequisitions(updated);
  return updated;
};

export const updateRequisitionRecord = (updatedRecord: RequisitionRecord): RequisitionRecord[] => {
  const current = getStoredRequisitions();
  const updated = current.map((item) => (item.id === updatedRecord.id ? updatedRecord : item));
  saveRequisitions(updated);
  return updated;
};

// Helper to determine next status based on workflow rules
export const calculateNextStatus = (req: RequisitionRecord): RequisitionStatus => {
  // If PI hasn't approved
  if (req.piApproval?.status === 'rejected') return 'rejected';
  if (req.piApproval?.status !== 'approved') return 'submitted_pending_pi';

  const hasLab = req.type === 'LAB_FACILITY' || (req.type === 'COMBINED' && req.labAccessDetails && req.labAccessDetails.some((l) => l.selected));
  const hasIT = req.type === 'IT_HRMS' || req.type === 'COMBINED';

  // Check Lab approvals if lab requested
  if (hasLab) {
    const selectedLabs = req.labAccessDetails?.filter((l) => l.selected) || [];
    const labApproved = selectedLabs.length > 0 && selectedLabs.every((l) => l.nodalApprovalStatus === 'approved');
    const labRejected = selectedLabs.some((l) => l.nodalApprovalStatus === 'rejected');
    if (labRejected) return 'rejected';
    if (!labApproved) return 'in_lab_review';
  }

  // Section Head authorization check
  if (req.sectionHeadApproval?.status === 'rejected') return 'rejected';
  if (req.sectionHeadApproval?.status !== 'approved') return 'pending_section_head';

  // Technical provisioning check for IT/HRMS
  if (hasIT && req.itCellVerification) {
    const { emailNetOfficer, hrmsOfficer } = req.itCellVerification;
    let emailOk = true;
    let hrmsOk = true;

    if (req.itHrmsDetails?.requestEmail || req.itHrmsDetails?.requestInternet) {
      if (emailNetOfficer?.status !== 'verified') emailOk = false;
    }
    if (req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric) {
      if (hrmsOfficer?.status !== 'verified') hrmsOk = false;
    }

    if (!emailOk || !hrmsOk) return 'in_tech_verification';
  } else if (hasIT) {
    return 'in_tech_verification';
  }

  return 'approved_provisioned';
};
