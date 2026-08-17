import { SecurityAuditLogEntry, UserRole } from '../types/requisition';

const STORAGE_KEY_AUDIT_LOGS = 'wii_security_audit_logs_v1';

export const INITIAL_SECURITY_AUDIT_LOGS: SecurityAuditLogEntry[] = [
  // 1. User / Applicant Role Logs (Dr. Ananya Sharma)
  {
    id: 'LOG-2026-00101',
    timestamp: '2026-08-16 10:30:00 IST',
    actorName: 'Dr. Ananya Sharma',
    actorEmail: 'ananya.sharma@wii.gov.in',
    actorRole: 'applicant',
    actorRoleLabel: 'User / Senior Research Fellow',
    actionType: 'OFFICE_ORDER_UPLOAD',
    module: 'User Profile [Dr. Ananya Sharma]',
    summary: 'Uploaded & AI OCR-Verified Sanction Office Order (Ref: WII/ADMN/2026/ORD-891). 100% OCR parameter confidence.',
    details: {
      previousValue: 'None / Pending Sanction Order',
      newValue: 'WII_Office_Order_Engagement_2026.pdf (Verified)',
      targetEntity: 'Sanction Order Record',
      ipAddress: '14.139.241.12',
      comments: 'AI Vision OCR engine auto-extracted Order Ref, Cadre (SRF), Tenure (2026-2028), PI Name (Dr. R. K. Singh), and Emoluments (₹42,000 + HRA).',
    },
    ipAddress: '14.139.241.12',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-00102',
    timestamp: '2026-08-16 09:15:00 IST',
    actorName: 'Dr. Ananya Sharma',
    actorEmail: 'ananya.sharma@wii.gov.in',
    actorRole: 'applicant',
    actorRoleLabel: 'User / Senior Research Fellow',
    actionType: 'REQUISITION_SUBMIT',
    module: 'Requisition Portal (#WII/2026/0101)',
    summary: 'Submitted multi-service requisition for WII Institutional Email, Wi-Fi MAC Access, HRMS ERP & Analytical GIS Lab.',
    details: {
      previousValue: 'Draft Form',
      newValue: 'Submitted (pending_pi)',
      targetEntity: 'Requisition #WII/2026/0101',
      ipAddress: '14.139.241.12',
      comments: 'Forwarded to Reporting Manager / Supervisor (Dr. R. K. Singh) for Level-1 endorsement.',
    },
    ipAddress: '14.139.241.12',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-00103',
    timestamp: '2026-08-15 14:05:22 IST',
    actorName: 'Dr. Ananya Sharma',
    actorEmail: 'ananya.sharma@wii.gov.in',
    actorRole: 'applicant',
    actorRoleLabel: 'User / Senior Research Fellow',
    actionType: 'PROFILE_UPDATE',
    module: 'User Profile & Identity Details',
    summary: 'Updated contact details, mobile number (+91 98765 43210) and intercom extension (214).',
    details: {
      previousValue: 'Intercom: Not Specified',
      newValue: 'Intercom: 214',
      targetEntity: 'Applicant Profile Record',
      ipAddress: '14.139.241.12',
    },
    ipAddress: '14.139.241.12',
    status: 'SUCCESS',
  },

  // 2. Reporting Manager / Supervisor (PI) Role Logs (Dr. R. K. Singh)
  {
    id: 'LOG-2026-00201',
    timestamp: '2026-08-16 11:45:10 IST',
    actorName: 'Dr. R. K. Singh',
    actorEmail: 'rksingh@wii.gov.in',
    actorRole: 'supervisor',
    actorRoleLabel: 'Reporting Manager / Supervisor (PI)',
    actionType: 'PI_APPROVAL',
    module: 'Supervisor Review Desk (#WII/2026/0101)',
    summary: 'Approved & Recommended Requisition #WII/2026/0101 for Dr. Ananya Sharma. Cryptographic digital signature appended.',
    details: {
      previousValue: 'Status: submitted_pending_pi',
      newValue: 'Status: pi_approved_pending_tech',
      targetEntity: 'Requisition Workflow Step 1',
      digitalSignature: 'SIG-RKSINGH-9912-A8F03',
      ipAddress: '14.139.241.45',
      comments: 'Recommended. Scholar requires institutional webmail & GIS Lab access for ongoing DST research project.',
    },
    ipAddress: '14.139.241.45',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-00202',
    timestamp: '2026-08-14 15:30:00 IST',
    actorName: 'Dr. R. K. Singh',
    actorEmail: 'rksingh@wii.gov.in',
    actorRole: 'supervisor',
    actorRoleLabel: 'Reporting Manager / Supervisor (PI)',
    actionType: 'PROFILE_UPDATE',
    module: 'Scholar Supervision Roster',
    summary: 'Confirmed supervisorship for 4 Senior Research Fellows under Landscape Level Planning & GIS Project.',
    details: {
      targetEntity: 'PI Project Roster',
      ipAddress: '14.139.241.45',
    },
    ipAddress: '14.139.241.45',
    status: 'SUCCESS',
  },

  // 3. IT Head / Officer Role Logs (Mr. Dinesh Singh Pundir)
  {
    id: 'LOG-2026-00301',
    timestamp: '2026-08-16 12:10:00 IST',
    actorName: 'Mr. Dinesh Singh Pundir',
    actorEmail: 'dinesh.pundir@wii.gov.in',
    actorRole: 'it_officer',
    actorRoleLabel: 'Senior Technical Officer - III (IT Head)',
    actionType: 'IT_EMAIL_PROVISION',
    module: 'IT Email & Network Cell (#WII/2026/0101)',
    summary: 'Created & Provisioned official WII Email mailbox "ananya.sharma@wii.gov.in" with 10 GB quota on MailServer-01.',
    details: {
      previousValue: 'Email: Unassigned',
      newValue: 'Assigned: ananya.sharma@wii.gov.in (Quota: 10GB)',
      targetEntity: 'Requisition Technical Provisioning',
      ipAddress: '14.139.241.138',
      comments: 'SMTP/IMAP account credentials generated and linked with user profile.',
    },
    ipAddress: '14.139.241.138',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-00302',
    timestamp: '2026-08-16 12:12:30 IST',
    actorName: 'Mr. Dinesh Singh Pundir',
    actorEmail: 'dinesh.pundir@wii.gov.in',
    actorRole: 'it_officer',
    actorRoleLabel: 'Senior Technical Officer - III (IT Head)',
    actionType: 'IT_WIFI_BINDING',
    module: 'Campus High-Speed Wi-Fi Gateway',
    summary: 'Bound Wi-Fi Hardware MAC address (FC:34:97:88:AB:12) to WII High-Speed Campus Network Controller.',
    details: {
      newValue: 'MAC: FC:34:97:88:AB:12 (Active Bandwidth: 100 Mbps)',
      targetEntity: 'Wi-Fi Access Binding Table',
      ipAddress: '14.139.241.138',
    },
    ipAddress: '14.139.241.138',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-00303',
    timestamp: '2026-08-13 10:00:00 IST',
    actorName: 'Mr. Dinesh Singh Pundir',
    actorEmail: 'dinesh.pundir@wii.gov.in',
    actorRole: 'it_officer',
    actorRoleLabel: 'Senior Technical Officer - III (IT Head)',
    actionType: 'SERVICE_MASTER_EDIT',
    module: 'Service Master Configuration',
    summary: 'Modified Service Master SRV-01 "Institutional Webmail (@wii.gov.in)" quota policy to 10 GB per user.',
    details: {
      previousValue: 'Quota: 5 GB / user',
      newValue: 'Quota: 10 GB / user',
      targetEntity: 'Service Master SRV-01',
      ipAddress: '14.139.241.138',
    },
    ipAddress: '14.139.241.138',
    status: 'SUCCESS',
  },

  // 4. HRMS & Biometric Officer Role Logs (Mr. Harendra Kumar)
  {
    id: 'LOG-2026-00401',
    timestamp: '2026-08-16 12:35:00 IST',
    actorName: 'Mr. Harendra Kumar',
    actorEmail: 'harendra.kumar@wii.gov.in',
    actorRole: 'hrms_officer',
    actorRoleLabel: 'HRMS & Biometric Cell Officer',
    actionType: 'HRMS_PORTAL_GRANT',
    module: 'HRMS ERP Portal Database',
    summary: 'Granted HRMS PMS Portal login access and mapped employee profile code "EMP-WII-2026-99".',
    details: {
      previousValue: 'HRMS Access: False',
      newValue: 'HRMS Access: True (Emp Code: EMP-WII-2026-99)',
      targetEntity: 'HRMS Database Record',
      ipAddress: '14.139.241.182',
    },
    ipAddress: '14.139.241.182',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-00402',
    timestamp: '2026-08-16 12:40:15 IST',
    actorName: 'Mr. Harendra Kumar',
    actorEmail: 'harendra.kumar@wii.gov.in',
    actorRole: 'hrms_officer',
    actorRoleLabel: 'HRMS & Biometric Cell Officer',
    actionType: 'BIOMETRIC_ENROLL',
    module: 'Biometric Gate Access Controller',
    summary: 'Enrolled Biometric Punch ID "WII-BIO-1088" and assigned attendance security PIN into central biometric server.',
    details: {
      previousValue: 'Biometric ID: Unregistered',
      newValue: 'Biometric ID: WII-BIO-1088 (Enrolled)',
      targetEntity: 'Biometric Punch Registry',
      ipAddress: '14.139.241.182',
    },
    ipAddress: '14.139.241.182',
    status: 'SUCCESS',
  },

  // 5. Nodal Officer Role Logs (Dr. S. K. Gupta)
  {
    id: 'LOG-2026-00501',
    timestamp: '2026-08-16 13:00:00 IST',
    actorName: 'Dr. S. K. Gupta',
    actorEmail: 'skgupta@wii.gov.in',
    actorRole: 'lab_nodal',
    actorRoleLabel: 'Nodal Officer (Analytical Labs)',
    actionType: 'LAB_SLOT_APPROVAL',
    module: 'Analytical & Spectrophotometry Lab',
    summary: 'Approved lab instrument slot allocation for HPLC & Mass Spectrometer for scholar Dr. Ananya Sharma.',
    details: {
      previousValue: 'Slot Status: Pending Nodal Approval',
      newValue: 'Slot Status: Approved & Reserved',
      targetEntity: 'Facility Slot Booking #FAC-07',
      ipAddress: '14.139.241.155',
    },
    ipAddress: '14.139.241.155',
    status: 'SUCCESS',
  },

  // 6. Associate Nodal Officer Role Logs (Dr. Neha Verma)
  {
    id: 'LOG-2026-00601',
    timestamp: '2026-08-14 14:20:00 IST',
    actorName: 'Dr. Neha Verma',
    actorEmail: 'neha.verma@wii.gov.in',
    actorRole: 'assoc_lab_nodal',
    actorRoleLabel: 'Associate Nodal Officer',
    actionType: 'LAB_SLOT_APPROVAL',
    module: 'Microscopy & Research Facility',
    summary: 'Verified specimen safety logs and authorized stereo-zoom imaging suite access for Research Scholar team.',
    details: {
      targetEntity: 'Facility Master #FAC-01',
      ipAddress: '14.139.241.156',
    },
    ipAddress: '14.139.241.156',
    status: 'SUCCESS',
  },

  // 7. Manager / Section Head Role Logs (Dr. Panna Lal)
  {
    id: 'LOG-2026-00701',
    timestamp: '2026-08-16 13:30:00 IST',
    actorName: 'Dr. Panna Lal',
    actorEmail: 'pannalal@wii.gov.in',
    actorRole: 'section_head',
    actorRoleLabel: 'Section Head / Manager (IT/GIS)',
    actionType: 'SECTION_HEAD_AUTHORIZATION',
    module: 'Facility Operations Desk (#WII/2026/0101)',
    summary: 'Granted final Manager authorization & clearance on Requisition #WII/2026/0101. Digital signature SIG-PLAL-SEC-101 verified.',
    details: {
      previousValue: 'Status: lab_approved_pending_section_head',
      newValue: 'Status: approved_provisioned',
      targetEntity: 'Requisition Final Clearance Step',
      digitalSignature: 'SIG-PLAL-SEC-101-9921',
      ipAddress: '14.139.241.101',
      comments: 'Final institutional authorization issued.',
    },
    ipAddress: '14.139.241.101',
    status: 'SUCCESS',
  },

  // 8. Admin Role Logs (Dr. Virendra Kumar)
  {
    id: 'LOG-2026-00801',
    timestamp: '2026-08-16 08:55:12 IST',
    actorName: 'Dr. Virendra Kumar',
    actorEmail: 'virendrakumar@wii.gov.in',
    actorRole: 'admin',
    actorRoleLabel: 'Director General & System Admin',
    actionType: 'ROLE_CHANGE',
    module: 'Master User Roles Management',
    summary: 'Updated Master System Role for Dr. R. K. Singh from User to Reporting Manager / Supervisor (PI).',
    details: {
      previousValue: 'Role: applicant (User)',
      newValue: 'Role: supervisor (Reporting Manager)',
      targetEntity: 'Master User Record USR-003',
      ipAddress: '14.139.241.2',
    },
    ipAddress: '14.139.241.2',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-00802',
    timestamp: '2026-08-15 16:20:00 IST',
    actorName: 'Dr. Virendra Kumar',
    actorEmail: 'virendrakumar@wii.gov.in',
    actorRole: 'admin',
    actorRoleLabel: 'Director General & System Admin',
    actionType: 'FACILITY_MASTER_EDIT',
    module: 'Facilities Master',
    summary: 'Added new Master Facility FAC-10 "Wildlife Genetics & Genomics Facility" with Nodal Officer Dr. Samrat Mondol.',
    details: {
      newValue: 'Facility FAC-10 (Active)',
      targetEntity: 'Facilities Master Registry',
      ipAddress: '14.139.241.2',
    },
    ipAddress: '14.139.241.2',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-2026-00803',
    timestamp: '2026-08-14 11:10:05 IST',
    actorName: 'Dr. Virendra Kumar',
    actorEmail: 'virendrakumar@wii.gov.in',
    actorRole: 'admin',
    actorRoleLabel: 'Director General & System Admin',
    actionType: 'SYSTEM_CONFIG_CHANGE',
    module: 'System Security & Maintenance Parameters',
    summary: 'Configured System Maintenance Parameter: Toggled Emergency Approval Bypass for Field Expeditions to ACTIVE.',
    details: {
      previousValue: 'Emergency Bypass: INACTIVE',
      newValue: 'Emergency Bypass: ACTIVE',
      targetEntity: 'Central System Config',
      ipAddress: '14.139.241.2',
    },
    ipAddress: '14.139.241.2',
    status: 'SUCCESS',
  },
];

export const getStoredAuditLogs = (): SecurityAuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(INITIAL_SECURITY_AUDIT_LOGS));
      return INITIAL_SECURITY_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(INITIAL_SECURITY_AUDIT_LOGS));
      return INITIAL_SECURITY_AUDIT_LOGS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse security audit logs from localStorage:', e);
    return INITIAL_SECURITY_AUDIT_LOGS;
  }
};

export const saveAuditLogs = (logs: SecurityAuditLogEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('wii_audit_logs_updated', { detail: { logs } }));
  } catch (e) {
    console.error('Failed to save security audit logs to localStorage:', e);
  }
};

export const recordSecurityAuditLog = (
  entry: Omit<SecurityAuditLogEntry, 'id' | 'timestamp' | 'ipAddress' | 'status'> & Partial<SecurityAuditLogEntry>
): SecurityAuditLogEntry => {
  const currentLogs = getStoredAuditLogs();
  
  const now = new Date();
  const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`;

  const newLog: SecurityAuditLogEntry = {
    id: `LOG-${now.getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`,
    timestamp: entry.timestamp || formattedTimestamp,
    actorName: entry.actorName || 'System Officer',
    actorEmail: entry.actorEmail || 'admin@wii.gov.in',
    actorRole: entry.actorRole || 'admin',
    actorRoleLabel: entry.actorRoleLabel || getRoleHumanLabel(entry.actorRole || 'admin'),
    actionType: entry.actionType,
    module: entry.module,
    summary: entry.summary,
    details: entry.details,
    ipAddress: entry.ipAddress || '14.139.241.12',
    status: entry.status || 'SUCCESS',
  };

  const updatedLogs = [newLog, ...currentLogs];
  saveAuditLogs(updatedLogs);
  return newLog;
};

export const getRoleHumanLabel = (role: UserRole): string => {
  switch (role) {
    case 'applicant':
      return 'User / Applicant';
    case 'supervisor':
      return 'Reporting Manager / Supervisor (PI)';
    case 'lab_nodal':
      return 'Nodal Officer';
    case 'assoc_lab_nodal':
      return 'Associate Nodal Officer';
    case 'it_officer':
      return 'Senior Technical Officer - III (IT Head)';
    case 'section_head':
      return 'Manager / Section Head';
    case 'hrms_officer':
      return 'HRMS & Biometric Cell Officer';
    case 'admin':
      return 'Director General & System Admin';
    default:
      return role;
  }
};
