import React, { useState } from 'react';
import { Database, Table, Copy, Check, Download, Code, Layers, Key, Shield, HardDrive } from 'lucide-react';

interface DatabaseSchemaSectionProps {
  managedUsersCount: number;
  facilitiesCount: number;
  servicesCount: number;
  requisitionsCount: number;
}

interface TableColumn {
  name: string;
  type: string;
  key?: 'PK' | 'FK' | 'UNI';
  nullable: boolean;
  defaultVal?: string;
  comment: string;
}

interface TableDefinition {
  id: string;
  name: string;
  rowCount: number | string;
  description: string;
  columns: TableColumn[];
  sqlQuery: string;
}

export const DatabaseSchemaSection: React.FC<DatabaseSchemaSectionProps> = ({
  managedUsersCount,
  facilitiesCount,
  servicesCount,
  requisitionsCount,
}) => {
  const [activeTableId, setActiveTableId] = useState<string>('users');
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);
  const [copiedFullSql, setCopiedFullSql] = useState(false);
  const [dbTestState, setDbTestState] = useState<{ loading: boolean; result: any | null }>({
    loading: false,
    result: null,
  });

  const handleTestConnection = async () => {
    setDbTestState({ loading: true, result: null });
    try {
      const res = await fetch('/api/db/test');
      const data = await res.json();
      setDbTestState({ loading: false, result: data });
    } catch (err: any) {
      setDbTestState({ loading: false, result: { connected: false, error: err.message || 'Server connection failed' } });
    }
  };

  const tables: TableDefinition[] = [
    {
      id: 'users',
      name: 'users',
      rowCount: managedUsersCount,
      description: 'Master user directory, login credentials, intercom extensions & assigned system roles.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', nullable: false, comment: 'Primary Key e.g. USR-001' },
        { name: 'full_name', type: 'VARCHAR(150)', nullable: false, comment: 'Full Official Name' },
        { name: 'email', type: 'VARCHAR(150)', key: 'UNI', nullable: false, comment: 'Unique @wii.gov.in or personal email' },
        { name: 'phone', type: 'VARCHAR(15)', nullable: false, comment: '10-Digit Mobile Number' },
        { name: 'password_hash', type: 'VARCHAR(255)', nullable: false, comment: 'Hashed password string' },
        { name: 'is_activated', type: 'BOOLEAN', nullable: false, defaultVal: 'FALSE', comment: 'Account email activation status' },
        { name: 'activation_token', type: 'VARCHAR(100)', nullable: true, comment: 'Verification link token' },
        { name: 'role', type: 'ENUM(...)', nullable: false, defaultVal: "'applicant'", comment: 'Role: applicant, supervisor, lab_nodal, assoc_lab_nodal, section_head, it_officer, hrms_officer, admin, super_admin' },
        { name: 'intercom_extension', type: 'VARCHAR(20)', nullable: true, defaultVal: "'100'", comment: 'WII internal intercom number' },
        { name: 'status', type: 'ENUM(...)', nullable: false, defaultVal: "'active'", comment: 'active, inactive, suspended' },
        { name: 'last_active_at', type: 'TIMESTAMP', nullable: true, comment: 'Last login timestamp' },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', comment: 'Creation timestamp' },
        { name: 'updated_at', type: 'TIMESTAMP', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', comment: 'Auto update timestamp' },
      ],
      sqlQuery: `CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_activated BOOLEAN DEFAULT FALSE,
    activation_token VARCHAR(100) NULL,
    role ENUM('applicant', 'supervisor', 'lab_nodal', 'assoc_lab_nodal', 'section_head', 'it_officer', 'hrms_officer', 'admin', 'super_admin') DEFAULT 'applicant',
    intercom_extension VARCHAR(20) DEFAULT '100',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);`,
    },
    {
      id: 'applicant_profiles',
      name: 'applicant_profiles',
      rowCount: managedUsersCount,
      description: 'Personal, academic, financial, bank details & office engagement order attachments.',
      columns: [
        { name: 'id', type: 'INT AUTO_INCREMENT', key: 'PK', nullable: false, comment: 'Primary Key ID' },
        { name: 'user_id', type: 'VARCHAR(50)', key: 'FK', nullable: false, comment: 'Foreign key -> users.id' },
        { name: 'salutation', type: 'VARCHAR(20)', nullable: true, defaultVal: "'Dr.'", comment: 'Honorific e.g. Dr., Mr., Ms.' },
        { name: 'applicant_name', type: 'VARCHAR(150)', nullable: false, comment: 'Applicant Full Name' },
        { name: 'gender', type: 'VARCHAR(20)', nullable: true, comment: 'Male, Female, Other' },
        { name: 'date_of_birth', type: 'DATE', nullable: true, comment: 'DOB' },
        { name: 'blood_group', type: 'VARCHAR(10)', nullable: true, comment: 'Blood Group e.g. O+' },
        { name: 'mobile_no', type: 'VARCHAR(15)', nullable: false, comment: 'Phone number' },
        { name: 'personal_email', type: 'VARCHAR(150)', nullable: false, comment: 'Personal email address' },
        { name: 'wii_official_email', type: 'VARCHAR(150)', nullable: true, comment: '@wii.gov.in email' },
        { name: 'designation', type: 'VARCHAR(150)', nullable: true, comment: 'Academic/Official designation' },
        { name: 'department_cell_project', type: 'VARCHAR(255)', nullable: false, comment: 'Assigned WII Department/Project' },
        { name: 'supervising_officer_name', type: 'VARCHAR(150)', nullable: false, comment: 'Reporting Officer / Supervising PI' },
        { name: 'pan_no', type: 'VARCHAR(20)', nullable: true, comment: 'PAN Number' },
        { name: 'bank_name', type: 'VARCHAR(150)', nullable: true, comment: 'Bank Name' },
        { name: 'account_no', type: 'VARCHAR(50)', nullable: true, comment: 'Bank Account Number' },
        { name: 'ifsc_code', type: 'VARCHAR(20)', nullable: true, comment: 'IFSC Code' },
        { name: 'office_order_file_name', type: 'VARCHAR(255)', nullable: true, comment: 'Uploaded Engagement Order PDF' },
        { name: 'biometric_id', type: 'VARCHAR(50)', nullable: true, comment: 'Assigned Biometric Machine Punch ID' },
      ],
      sqlQuery: `CREATE TABLE applicant_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    salutation VARCHAR(20) DEFAULT 'Dr.',
    applicant_name VARCHAR(150) NOT NULL,
    gender VARCHAR(20),
    date_of_birth DATE,
    blood_group VARCHAR(10),
    mobile_no VARCHAR(15) NOT NULL,
    personal_email VARCHAR(150) NOT NULL,
    wii_official_email VARCHAR(150),
    designation VARCHAR(150),
    department_cell_project VARCHAR(255) NOT NULL,
    supervising_officer_name VARCHAR(150) NOT NULL,
    pan_no VARCHAR(20),
    bank_name VARCHAR(150),
    account_no VARCHAR(50),
    ifsc_code VARCHAR(20),
    office_order_file_name VARCHAR(255),
    biometric_id VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
    },
    {
      id: 'facility_masters',
      name: 'facility_masters',
      rowCount: facilitiesCount,
      description: 'Laboratory & equipment facilities master list linked directly to Master Officers by Role.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', nullable: false, comment: 'Facility Code e.g. FAC-01' },
        { name: 'facility_name', type: 'VARCHAR(255)', nullable: false, comment: 'Name of Lab / Facility' },
        { name: 'department', type: 'VARCHAR(150)', nullable: true, comment: 'Division / Cell' },
        { name: 'nodal_officer_id', type: 'VARCHAR(50)', key: 'FK', nullable: true, comment: 'FK -> users.id (WHERE role = lab_nodal)' },
        { name: 'nodal_officer_name', type: 'VARCHAR(150)', nullable: false, comment: 'Nodal Officer Name' },
        { name: 'assoc_nodal_officer_id', type: 'VARCHAR(50)', key: 'FK', nullable: true, comment: 'FK -> users.id (WHERE role = assoc_lab_nodal)' },
        { name: 'assoc_nodal_officer_name', type: 'VARCHAR(150)', nullable: false, comment: 'Associate Nodal Officer Name' },
        { name: 'supervisor_id', type: 'VARCHAR(50)', key: 'FK', nullable: true, comment: 'FK -> users.id (WHERE role = hrms_officer / supervisor)' },
        { name: 'supervisor_name', type: 'VARCHAR(150)', nullable: false, comment: 'Lab Technical Supervisor Name' },
        { name: 'description', type: 'TEXT', nullable: true, comment: 'Instruments & capabilities' },
        { name: 'status', type: 'ENUM(...)', nullable: false, defaultVal: "'active'", comment: 'active, inactive, maintenance' },
      ],
      sqlQuery: `CREATE TABLE facility_masters (
    id VARCHAR(50) PRIMARY KEY,
    facility_name VARCHAR(255) NOT NULL,
    department VARCHAR(150) DEFAULT 'Research Laboratories Division',
    nodal_officer_id VARCHAR(50) NULL,
    nodal_officer_name VARCHAR(150) NOT NULL,
    assoc_nodal_officer_id VARCHAR(50) NULL,
    assoc_nodal_officer_name VARCHAR(150) NOT NULL,
    supervisor_id VARCHAR(50) NULL,
    supervisor_name VARCHAR(150) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    FOREIGN KEY (nodal_officer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assoc_nodal_officer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
);`,
    },
    {
      id: 'service_masters',
      name: 'service_masters',
      rowCount: servicesCount,
      description: 'IT & Network services master linked directly to Manager Officers by Role.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', nullable: false, comment: 'Service Code e.g. SRV-01' },
        { name: 'service_name', type: 'VARCHAR(255)', nullable: false, comment: 'Title of Service' },
        { name: 'manager_id', type: 'VARCHAR(50)', key: 'FK', nullable: true, comment: 'FK -> users.id (WHERE role IN section_head, it_officer, admin)' },
        { name: 'manager_name', type: 'VARCHAR(150)', nullable: false, comment: 'In-Charge Manager Officer Name' },
        { name: 'quota_access_specs', type: 'VARCHAR(255)', nullable: true, comment: 'Quota e.g. 10 GB / user' },
        { name: 'status', type: 'ENUM(...)', nullable: false, defaultVal: "'active'", comment: 'active, inactive' },
      ],
      sqlQuery: `CREATE TABLE service_masters (
    id VARCHAR(50) PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    manager_id VARCHAR(50) NULL,
    manager_name VARCHAR(150) NOT NULL,
    quota_access_specs VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);`,
    },
    {
      id: 'requisitions',
      name: 'requisitions',
      rowCount: requisitionsCount,
      description: 'Access Requisition master applications tracking workflow lifecycle stages.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', nullable: false, comment: 'Access ID e.g. WII/2026/0101' },
        { name: 'applicant_id', type: 'VARCHAR(50)', key: 'FK', nullable: false, comment: 'Foreign key -> users.id' },
        { name: 'requisition_type', type: 'ENUM(...)', nullable: false, comment: 'IT_HRMS, LAB_FACILITY, COMBINED' },
        { name: 'status', type: 'ENUM(...)', nullable: false, defaultVal: "'submitted_pending_pi'", comment: 'submitted_pending_pi, pi_approved, in_lab_review, pending_section_head, in_tech_verification, approved_provisioned, rejected, deactivated' },
        { name: 'requisition_mode', type: 'ENUM(...)', nullable: false, defaultVal: "'new'", comment: 'new or renewal' },
        { name: 'renewal_reason', type: 'TEXT', nullable: true, comment: 'Mandatory reason if renewal requested' },
        { name: 'submitted_at', type: 'TIMESTAMP', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', comment: 'Submission time' },
      ],
      sqlQuery: `CREATE TABLE requisitions (
    id VARCHAR(50) PRIMARY KEY,
    applicant_id VARCHAR(50) NOT NULL,
    requisition_type ENUM('IT_HRMS', 'LAB_FACILITY', 'COMBINED') NOT NULL,
    status ENUM('submitted_pending_pi', 'pi_approved', 'in_lab_review', 'pending_section_head', 'in_tech_verification', 'approved_provisioned', 'rejected', 'deactivated') DEFAULT 'submitted_pending_pi',
    requisition_mode ENUM('new', 'renewal') DEFAULT 'new',
    renewal_reason TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE
);`,
    },
    {
      id: 'it_hrms_details',
      name: 'it_hrms_details',
      rowCount: requisitionsCount,
      description: 'Detailed requested specs for Webmail, WiFi MAC Binding, HRMS ERP & Biometric Attendance.',
      columns: [
        { name: 'id', type: 'INT AUTO_INCREMENT', key: 'PK', nullable: false, comment: 'Primary Key' },
        { name: 'requisition_id', type: 'VARCHAR(50)', key: 'FK', nullable: false, comment: 'Foreign key -> requisitions.id' },
        { name: 'request_email', type: 'BOOLEAN', nullable: false, defaultVal: 'FALSE', comment: 'Institutional Webmail Flag' },
        { name: 'requested_email_prefix', type: 'VARCHAR(100)', nullable: true, comment: 'Requested username prefix' },
        { name: 'request_internet', type: 'BOOLEAN', nullable: false, defaultVal: 'FALSE', comment: 'WiFi MAC Binding Flag' },
        { name: 'device_type', type: 'VARCHAR(100)', nullable: true, comment: 'Hardware type' },
        { name: 'mac_address', type: 'VARCHAR(50)', nullable: true, comment: 'Hardware MAC address' },
        { name: 'request_hrms_pms', type: 'BOOLEAN', nullable: false, defaultVal: 'FALSE', comment: 'HRMS ERP Flag' },
        { name: 'request_biometric', type: 'BOOLEAN', nullable: false, defaultVal: 'FALSE', comment: 'Biometric Punch Flag' },
        { name: 'provisioned_email', type: 'VARCHAR(150)', nullable: true, comment: 'Final allocated email address' },
        { name: 'provisioned_mac', type: 'VARCHAR(50)', nullable: true, comment: 'Bound MAC address' },
        { name: 'provisioned_biometric_id', type: 'VARCHAR(50)', nullable: true, comment: 'Assigned Punch Machine ID' },
      ],
      sqlQuery: `CREATE TABLE it_hrms_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id VARCHAR(50) NOT NULL UNIQUE,
    request_email BOOLEAN DEFAULT FALSE,
    requested_email_prefix VARCHAR(100),
    request_internet BOOLEAN DEFAULT FALSE,
    device_type VARCHAR(100),
    mac_address VARCHAR(50),
    request_hrms_pms BOOLEAN DEFAULT FALSE,
    request_biometric BOOLEAN DEFAULT FALSE,
    provisioned_email VARCHAR(150),
    provisioned_mac VARCHAR(50),
    provisioned_biometric_id VARCHAR(50),
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE
);`,
    },
    {
      id: 'lab_facility_details',
      name: 'lab_facility_details',
      rowCount: 'Dynamic',
      description: 'Mapping of selected lab facilities to requisitions with individual Nodal Officer approvals.',
      columns: [
        { name: 'id', type: 'INT AUTO_INCREMENT', key: 'PK', nullable: false, comment: 'Primary Key' },
        { name: 'requisition_id', type: 'VARCHAR(50)', key: 'FK', nullable: false, comment: 'Foreign key -> requisitions.id' },
        { name: 'facility_id', type: 'VARCHAR(50)', key: 'FK', nullable: false, comment: 'Foreign key -> facility_masters.id' },
        { name: 'facility_name', type: 'VARCHAR(255)', nullable: false, comment: 'Facility Name' },
        { name: 'nodal_approval_status', type: 'ENUM(...)', nullable: false, defaultVal: "'pending'", comment: 'pending, approved, rejected' },
        { name: 'remarks', type: 'TEXT', nullable: true, comment: 'Nodal Officer remarks' },
        { name: 'reviewed_by', type: 'VARCHAR(150)', nullable: true, comment: 'Reviewing Nodal Officer' },
      ],
      sqlQuery: `CREATE TABLE lab_facility_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id VARCHAR(50) NOT NULL,
    facility_id VARCHAR(50) NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    nodal_approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    remarks TEXT,
    reviewed_by VARCHAR(150),
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facility_masters(id) ON DELETE CASCADE
);`,
    },
    {
      id: 'workflow_audit_logs',
      name: 'workflow_audit_logs',
      rowCount: '25+',
      description: 'Immutable legal audit trail recording all approval decisions, overrides, and timestamps.',
      columns: [
        { name: 'id', type: 'INT AUTO_INCREMENT', key: 'PK', nullable: false, comment: 'Primary Key' },
        { name: 'requisition_id', type: 'VARCHAR(50)', key: 'FK', nullable: false, comment: 'Foreign key -> requisitions.id' },
        { name: 'actor_name', type: 'VARCHAR(150)', nullable: false, comment: 'Officer/User performing action' },
        { name: 'actor_role', type: 'VARCHAR(50)', nullable: false, comment: 'System role of actor' },
        { name: 'action_type', type: 'ENUM(...)', nullable: false, comment: 'SUBMIT, PI_APPROVE, PI_REJECT, LAB_APPROVE, LAB_REJECT, SECTION_HEAD_APPROVE, TECH_PROVISION, OVERRIDE' },
        { name: 'remarks', type: 'TEXT', nullable: true, comment: 'Approval or rejection justification' },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultVal: 'CURRENT_TIMESTAMP', comment: 'Action timestamp' },
      ],
      sqlQuery: `CREATE TABLE workflow_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id VARCHAR(50) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action_type ENUM('SUBMIT', 'PI_APPROVE', 'PI_REJECT', 'LAB_APPROVE', 'LAB_REJECT', 'SECTION_HEAD_APPROVE', 'TECH_PROVISION', 'OVERRIDE') NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE
);`,
    },
    {
      id: 'office_order_verifications',
      name: 'office_order_verifications',
      rowCount: '10+',
      description: 'Verification logs for official engagement orders cross-matched against scholar applications.',
      columns: [
        { name: 'id', type: 'INT AUTO_INCREMENT', key: 'PK', nullable: false, comment: 'Primary Key' },
        { name: 'log_id', type: 'VARCHAR(50)', key: 'UNI', nullable: false, comment: 'Office Order Log ID e.g. LOG-002891' },
        { name: 'order_number', type: 'VARCHAR(100)', nullable: false, comment: 'Official Order Number e.g. WII/ADMN/2026/ORD-891' },
        { name: 'order_date', type: 'DATE', nullable: false, comment: 'Issue Date' },
        { name: 'file_name', type: 'VARCHAR(255)', nullable: false, comment: 'Uploaded PDF File Name' },
        { name: 'applicant_name', type: 'VARCHAR(150)', nullable: false, comment: 'Scholar / Staff Name' },
        { name: 'supervising_officer_name', type: 'VARCHAR(150)', nullable: false, comment: 'Reporting Officer in Order' },
        { name: 'verification_status', type: 'ENUM(...)', nullable: false, defaultVal: "'VERIFIED_MATCH'", comment: 'VERIFIED_MATCH, MISMATCH_FLAGGED' },
      ],
      sqlQuery: `CREATE TABLE office_order_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_id VARCHAR(50) NOT NULL UNIQUE,
    order_number VARCHAR(100) NOT NULL,
    order_date DATE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    applicant_name VARCHAR(150) NOT NULL,
    supervising_officer_name VARCHAR(150) NOT NULL,
    verification_status ENUM('VERIFIED_MATCH', 'MISMATCH_FLAGGED') DEFAULT 'VERIFIED_MATCH'
);`,
    },
  ];

  const currentTable = tables.find((t) => t.id === activeTableId) || tables[0];

  const handleCopyTableSql = (table: TableDefinition) => {
    navigator.clipboard.writeText(table.sqlQuery);
    setCopiedTableId(table.id);
    setTimeout(() => setCopiedTableId(null), 2000);
  };

  const handleCopyFullSql = () => {
    const fullSql = tables.map((t) => t.sqlQuery).join('\n\n');
    navigator.clipboard.writeText(`-- WII Access Portal Database Schema\nUSE wii_access_portal;\n\n${fullSql}`);
    setCopiedFullSql(true);
    setTimeout(() => setCopiedFullSql(false), 2000);
  };

  const handleDownloadSchemaFile = () => {
    const fullSql = tables.map((t) => `-- Table: ${t.name}\n${t.sqlQuery}`).join('\n\n');
    const blob = new Blob([`-- WII ACCESS MANAGEMENT PORTAL DATABASE SCHEMA\n-- Created for MySQL / MariaDB\nUSE wii_access_portal;\n\n${fullSql}`], {
      type: 'text/sql;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'wii_access_portal_schema.sql';
    link.click();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Database Schema & SQL Table Registry (9 Tables)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complete relational database schema for MySQL Workbench, Cloud SQL, or PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={dbTestState.loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {dbTestState.loading ? 'Testing DB...' : 'Test DB Connection'}
          </button>

          <button
            onClick={handleCopyFullSql}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
          >
            {copiedFullSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            {copiedFullSql ? 'Full SQL Copied!' : 'Copy Full SQL Script'}
          </button>

          <button
            onClick={handleDownloadSchemaFile}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            Download schema.sql
          </button>
        </div>
      </div>

      {/* Database Connection Test Status Result */}
      {dbTestState.result && (
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed ${
            dbTestState.result.connected
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="font-extrabold flex items-center gap-2 text-sm mb-1">
            {dbTestState.result.connected ? '✅ MySQL Database Connection Successful!' : '⚠️ Database Connection Setup Required'}
          </div>
          {dbTestState.result.connected ? (
            <p>Node.js Express backend is actively connected to the MySQL server instance.</p>
          ) : (
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Connection Status: <strong>{dbTestState.result.error}</strong>
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                To connect your local MySQL server (Workbench/XAMPP) or Remote MySQL: Set <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">DB_HOST</code>, <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">DB_USER</code>, <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">DB_PASSWORD</code>, and <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">DB_NAME</code> in your environment or <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">.env</code> file.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Table Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {tables.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTableId(t.id)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTableId === t.id
                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/20 text-purple-900 dark:text-purple-200 font-extrabold shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-bold truncate flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                {t.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300 font-black rounded-full shrink-0">
                {t.rowCount}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {t.columns.length} Columns
            </div>
          </button>
        ))}
      </div>

      {/* Active Table Details */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
        {/* Table Title Bar */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black font-mono tracking-wide text-purple-300">TABLE `{currentTable.name}`</span>
              <span className="text-[10px] font-extrabold bg-purple-500 text-slate-950 px-2 py-0.5 rounded-md uppercase">
                {currentTable.columns.length} COLUMNS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{currentTable.description}</p>
          </div>

          <button
            onClick={() => handleCopyTableSql(currentTable)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            {copiedTableId === currentTable.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
            {copiedTableId === currentTable.id ? 'Copied CREATE TABLE' : 'Copy SQL Table Query'}
          </button>
        </div>

        {/* Columns Structure Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Column Name</th>
                <th className="p-3">Data Type</th>
                <th className="p-3">Key</th>
                <th className="p-3">Null</th>
                <th className="p-3">Default</th>
                <th className="p-3">Description & Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-mono text-[11px]">
              {currentTable.columns.map((col, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {col.key === 'PK' && <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Primary Key" />}
                    {col.key === 'FK' && <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" title="Foreign Key" />}
                    {col.key === 'UNI' && <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Unique Index" />}
                    {col.name}
                  </td>
                  <td className="p-3 font-semibold text-purple-700 dark:text-purple-400">{col.type}</td>
                  <td className="p-3 font-extrabold">
                    {col.key ? (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                        col.key === 'PK' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        col.key === 'FK' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {col.key}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{col.nullable ? 'YES' : 'NO'}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 font-sans">{col.defaultVal || '-'}</td>
                  <td className="p-3 font-sans text-slate-700 dark:text-slate-300 font-medium">{col.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Code Snippet Box */}
        <div className="p-4 bg-slate-950 text-slate-200 border-t border-slate-800 font-mono text-xs overflow-x-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-purple-400" />
            MySQL Workbench DDL Code for `{currentTable.name}`
          </div>
          <pre className="text-emerald-400 text-[11px] leading-relaxed whitespace-pre-wrap">{currentTable.sqlQuery}</pre>
        </div>
      </div>
    </div>
  );
};
