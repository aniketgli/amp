-- ============================================================================
-- WILDLIFE INSTITUTE OF INDIA (WII) - ACCESS MANAGEMENT PORTAL
-- COMPLETE PRODUCTION DATABASE SCHEMA WITH ROLE-BASED DROPDOWN VIEWS
-- Created for MySQL 8.0+ / MariaDB / Cloud SQL
-- ============================================================================

-- Step 1: Create and select Database
CREATE DATABASE IF NOT EXISTS wii_access_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wii_access_portal;

-- Disable foreign key checks during creation
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- TABLE 1: USERS (Master User Directory & Role Credentials)
-- ============================================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY COMMENT 'Unique User ID e.g. USR-001',
    full_name VARCHAR(150) NOT NULL COMMENT 'Full Name of Official / Scholar',
    email VARCHAR(150) NOT NULL UNIQUE COMMENT 'Official @wii.gov.in or personal email',
    phone VARCHAR(15) NOT NULL COMMENT '10-Digit Mobile Number',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Encrypted/Hashed Password',
    is_activated BOOLEAN DEFAULT FALSE COMMENT 'Account activation status',
    activation_token VARCHAR(100) NULL COMMENT 'Token sent via Email for verification',
    role ENUM(
        'applicant', 
        'supervisor', 
        'lab_nodal', 
        'assoc_lab_nodal', 
        'section_head', 
        'it_officer', 
        'hrms_officer', 
        'admin', 
        'super_admin'
    ) NOT NULL DEFAULT 'applicant' COMMENT 'Assigned System Master Role',
    intercom_extension VARCHAR(20) DEFAULT '100' COMMENT 'Internal Intercom Telephone Extension',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_active_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB COMMENT='Master User Directory with Role Assignments';


-- ============================================================================
-- TABLE 2: APPLICANT_PROFILES (Detailed Scholar & Staff Academic Profiles)
-- ============================================================================
DROP TABLE IF EXISTS applicant_profiles;
CREATE TABLE applicant_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE COMMENT 'Foreign key to users.id',
    salutation VARCHAR(20) DEFAULT 'Dr.',
    applicant_name VARCHAR(150) NOT NULL,
    gender VARCHAR(20) DEFAULT 'Male',
    date_of_birth DATE NULL,
    blood_group VARCHAR(10) DEFAULT 'O+',
    mobile_no VARCHAR(15) NOT NULL,
    personal_email VARCHAR(150) NOT NULL,
    wii_official_email VARCHAR(150) NULL,
    address TEXT NULL,
    city VARCHAR(100) DEFAULT 'Dehradun',
    state VARCHAR(100) DEFAULT 'Uttarakhand',
    pincode VARCHAR(10) DEFAULT '248001',
    designation VARCHAR(150) DEFAULT 'Senior Research Fellow',
    department_cell_project VARCHAR(255) NOT NULL DEFAULT 'Dept. of Landscape Level Planning & GIS',
    supervising_officer_id VARCHAR(50) NULL COMMENT 'Foreign key to users.id (Supervisor role)',
    supervising_officer_name VARCHAR(150) NOT NULL DEFAULT 'Dr. R. K. Singh',
    date_of_joining DATE NULL,
    valid_up_to DATE NULL,
    pan_no VARCHAR(20) NULL,
    bank_name VARCHAR(150) NULL,
    account_no VARCHAR(50) NULL,
    ifsc_code VARCHAR(20) NULL,
    office_order_file_name VARCHAR(255) NULL COMMENT 'Uploaded Office Engagement Order File',
    biometric_id VARCHAR(50) NULL COMMENT 'Assigned Biometric Machine Punch ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (supervising_officer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_prof_dept (department_cell_project)
) ENGINE=InnoDB COMMENT='Complete Academic, Bank & Engagement Profiles';


-- ============================================================================
-- TABLE 3: FACILITY_MASTERS (Laboratory Facilities & Assigned Officers)
-- ============================================================================
DROP TABLE IF EXISTS facility_masters;
CREATE TABLE facility_masters (
    id VARCHAR(50) PRIMARY KEY COMMENT 'Facility ID e.g. FAC-01',
    facility_name VARCHAR(255) NOT NULL,
    department VARCHAR(150) DEFAULT 'Research Laboratories Division',
    nodal_officer_id VARCHAR(50) NULL COMMENT 'FK -> users.id (WHERE role = lab_nodal)',
    nodal_officer_name VARCHAR(150) NOT NULL COMMENT 'Primary Nodal Officer Name',
    assoc_nodal_officer_id VARCHAR(50) NULL COMMENT 'FK -> users.id (WHERE role = assoc_lab_nodal)',
    assoc_nodal_officer_name VARCHAR(150) NOT NULL COMMENT 'Associate Nodal Officer Name',
    supervisor_id VARCHAR(50) NULL COMMENT 'FK -> users.id (WHERE role = hrms_officer/supervisor)',
    supervisor_name VARCHAR(150) NOT NULL COMMENT 'Lab Technical Supervisor Name',
    description TEXT NULL,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nodal_officer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (assoc_nodal_officer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_fac_status (status)
) ENGINE=InnoDB COMMENT='Laboratory Facilities Master Records linked to Master User Roles';


-- ============================================================================
-- TABLE 4: SERVICE_MASTERS (IT, Network & Administrative Services Master)
-- ============================================================================
DROP TABLE IF EXISTS service_masters;
CREATE TABLE service_masters (
    id VARCHAR(50) PRIMARY KEY COMMENT 'Service ID e.g. SRV-01',
    service_name VARCHAR(255) NOT NULL,
    manager_id VARCHAR(50) NULL COMMENT 'FK -> users.id (WHERE role IN section_head, it_officer, admin)',
    manager_name VARCHAR(150) NOT NULL COMMENT 'Designated Service Manager Officer',
    quota_access_specs VARCHAR(255) DEFAULT 'Standard Quota',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_srv_status (status)
) ENGINE=InnoDB COMMENT='IT Services, Webmail & Network Masters linked to Master User Roles';


-- ============================================================================
-- TABLE 5: REQUISITIONS (Master Access Requisition Applications)
-- ============================================================================
DROP TABLE IF EXISTS requisitions;
CREATE TABLE requisitions (
    id VARCHAR(50) PRIMARY KEY COMMENT 'Application Access ID e.g. WII/2026/0101',
    applicant_id VARCHAR(50) NOT NULL COMMENT 'Foreign key to users.id',
    requisition_type ENUM('IT_HRMS', 'LAB_FACILITY', 'COMBINED') NOT NULL DEFAULT 'COMBINED',
    status ENUM(
        'draft',
        'submitted_pending_pi',
        'pi_approved',
        'in_lab_review',
        'pending_section_head',
        'in_tech_verification',
        'approved_provisioned',
        'rejected',
        'deactivated'
    ) NOT NULL DEFAULT 'submitted_pending_pi' COMMENT 'Current Workflow Stage',
    requisition_mode ENUM('new', 'renewal') NOT NULL DEFAULT 'new',
    renewal_reason TEXT NULL COMMENT 'Mandatory reason if renewal requested',
    remarks TEXT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_req_status (status),
    INDEX idx_req_type (requisition_type),
    INDEX idx_req_applicant (applicant_id)
) ENGINE=InnoDB COMMENT='Access Applications Master Table';


-- ============================================================================
-- TABLE 6: IT_HRMS_DETAILS (IT Webmail, MAC Binding & HRMS Access Requests)
-- ============================================================================
DROP TABLE IF EXISTS it_hrms_details;
CREATE TABLE it_hrms_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id VARCHAR(50) NOT NULL UNIQUE COMMENT 'Foreign key to requisitions.id',
    request_email BOOLEAN DEFAULT FALSE COMMENT 'Institutional Webmail Request',
    requested_email_prefix VARCHAR(100) NULL COMMENT 'Requested @wii.gov.in email username',
    requested_email_groups TEXT NULL COMMENT 'Selected mailing lists',
    request_internet BOOLEAN DEFAULT FALSE COMMENT 'Campus High-Speed WiFi Internet',
    device_type VARCHAR(100) NULL COMMENT 'Hardware e.g. Laptop Workstation',
    mac_address VARCHAR(50) NULL COMMENT 'Device Physical MAC Address (AA:BB:CC:DD:EE:FF)',
    request_hrms_pms BOOLEAN DEFAULT FALSE COMMENT 'HRMS & Payroll Management System',
    request_biometric BOOLEAN DEFAULT FALSE COMMENT 'Campus Biometric Punch Machine Access',
    provisioned_email VARCHAR(150) NULL COMMENT 'Final Created Email Address',
    provisioned_mac VARCHAR(50) NULL COMMENT 'Configured MAC Address',
    provisioned_hrms_id VARCHAR(50) NULL COMMENT 'Assigned HRMS ERP Employee ID',
    provisioned_biometric_id VARCHAR(50) NULL COMMENT 'Assigned Punch Machine ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='IT, Webmail, MAC & HRMS Specific Specs';


-- ============================================================================
-- TABLE 7: LAB_FACILITY_DETAILS (Selected Lab Facilities & Approval Status)
-- ============================================================================
DROP TABLE IF EXISTS lab_facility_details;
CREATE TABLE lab_facility_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id VARCHAR(50) NOT NULL COMMENT 'Foreign key to requisitions.id',
    facility_id VARCHAR(50) NOT NULL COMMENT 'Foreign key to facility_masters.id',
    facility_name VARCHAR(255) NOT NULL,
    nodal_approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    remarks TEXT NULL COMMENT 'Nodal Officer / Supervisor comments',
    reviewed_by_id VARCHAR(50) NULL COMMENT 'FK -> users.id (Reviewer)',
    reviewed_by VARCHAR(150) NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facility_masters(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_lab_req (requisition_id),
    INDEX idx_lab_status (nodal_approval_status)
) ENGINE=InnoDB COMMENT='Lab Facility Mapping & Nodal Approvals';


-- ============================================================================
-- TABLE 8: WORKFLOW_AUDIT_LOGS (Complete Workflow History & Approval Trail)
-- ============================================================================
DROP TABLE IF EXISTS workflow_audit_logs;
CREATE TABLE workflow_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requisition_id VARCHAR(50) NOT NULL COMMENT 'Foreign key to requisitions.id',
    actor_id VARCHAR(50) NULL COMMENT 'FK -> users.id',
    actor_name VARCHAR(150) NOT NULL COMMENT 'Officer / User who performed action',
    actor_role VARCHAR(50) NOT NULL COMMENT 'Role of actor',
    action_type ENUM(
        'SUBMIT', 
        'PI_APPROVE', 
        'PI_REJECT', 
        'LAB_APPROVE', 
        'LAB_REJECT', 
        'SECTION_HEAD_APPROVE', 
        'SECTION_HEAD_REJECT', 
        'TECH_PROVISION', 
        'REJECT',
        'OVERRIDE'
    ) NOT NULL,
    stage_from VARCHAR(100) NULL,
    stage_to VARCHAR(100) NULL,
    remarks TEXT NULL,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_audit_req (requisition_id),
    INDEX idx_audit_action (action_type)
) ENGINE=InnoDB COMMENT='Audit Trail for Legal & Compliance Records';


-- ============================================================================
-- TABLE 9: OFFICE_ORDER_VERIFICATIONS (Verified Engagement Orders Logs)
-- ============================================================================
DROP TABLE IF EXISTS office_order_verifications;
CREATE TABLE office_order_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_id VARCHAR(50) NOT NULL UNIQUE COMMENT 'Office Order Log ID e.g. LOG-002891',
    order_number VARCHAR(100) NOT NULL COMMENT 'e.g. WII/ADMN/2026/ORD-891',
    order_date DATE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    applicant_name VARCHAR(150) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    department_cell_project VARCHAR(255) NOT NULL,
    supervising_officer_name VARCHAR(150) NOT NULL,
    verification_status ENUM('VERIFIED_MATCH', 'MISMATCH_FLAGGED', 'PENDING') DEFAULT 'VERIFIED_MATCH',
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_num (order_number)
) ENGINE=InnoDB COMMENT='Verification Registry for Official Engagement Orders';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================
-- SQL ROLE-FILTERED VIEWS (For Master Dropdowns & Queries)
-- ============================================================================

-- View 1: Nodal Officers Dropdown Query
CREATE OR REPLACE VIEW v_dropdown_nodal_officers AS
SELECT 
    id AS user_id, 
    full_name, 
    email, 
    intercom_extension, 
    role, 
    status
FROM users
WHERE role = 'lab_nodal' AND status = 'active';

-- View 2: Associate Nodal Officers Dropdown Query
CREATE OR REPLACE VIEW v_dropdown_assoc_nodal_officers AS
SELECT 
    id AS user_id, 
    full_name, 
    email, 
    intercom_extension, 
    role, 
    status
FROM users
WHERE role = 'assoc_lab_nodal' AND status = 'active';

-- View 3: Supervisors Dropdown Query
CREATE OR REPLACE VIEW v_dropdown_supervisors AS
SELECT 
    id AS user_id, 
    full_name, 
    email, 
    intercom_extension, 
    role, 
    status
FROM users
WHERE role IN ('hrms_officer', 'supervisor') AND status = 'active';

-- View 4: Managers Dropdown Query
CREATE OR REPLACE VIEW v_dropdown_managers AS
SELECT 
    id AS user_id, 
    full_name, 
    email, 
    intercom_extension, 
    role, 
    status
FROM users
WHERE role IN ('section_head', 'it_officer', 'admin') AND status = 'active';


-- View 5: Joined Facilities Master with Master Users & Roles
CREATE OR REPLACE VIEW v_facility_masters_detailed AS
SELECT 
    f.id AS facility_id,
    f.facility_name,
    f.department,
    f.status AS facility_status,
    -- Nodal Officer Details
    u_nodal.id AS nodal_user_id,
    COALESCE(u_nodal.full_name, f.nodal_officer_name) AS nodal_officer_name,
    u_nodal.email AS nodal_email,
    -- Associate Nodal Officer Details
    u_assoc.id AS assoc_nodal_user_id,
    COALESCE(u_assoc.full_name, f.assoc_nodal_officer_name) AS assoc_nodal_officer_name,
    u_assoc.email AS assoc_nodal_email,
    -- Lab Technical Supervisor Details
    u_sup.id AS supervisor_user_id,
    COALESCE(u_sup.full_name, f.supervisor_name) AS supervisor_name,
    u_sup.email AS supervisor_email
FROM facility_masters f
LEFT JOIN users u_nodal ON f.nodal_officer_id = u_nodal.id AND u_nodal.role = 'lab_nodal'
LEFT JOIN users u_assoc ON f.assoc_nodal_officer_id = u_assoc.id AND u_assoc.role = 'assoc_lab_nodal'
LEFT JOIN users u_sup ON f.supervisor_id = u_sup.id AND u_sup.role IN ('hrms_officer', 'supervisor');


-- View 6: Joined Service Masters with Service Manager Role
CREATE OR REPLACE VIEW v_service_masters_detailed AS
SELECT 
    s.id AS service_id,
    s.service_name,
    s.quota_access_specs,
    s.status AS service_status,
    u_mgr.id AS manager_user_id,
    COALESCE(u_mgr.full_name, s.manager_name) AS manager_name,
    u_mgr.email AS manager_email,
    u_mgr.role AS manager_role
FROM service_masters s
LEFT JOIN users u_mgr ON s.manager_id = u_mgr.id AND u_mgr.role IN ('section_head', 'it_officer', 'admin');


-- ============================================================================
-- INITIAL SEED DATA WITH ROLE-LINKED MASTER RECORDS
-- ============================================================================

-- 1. Seed Users
INSERT INTO users (id, full_name, email, phone, password_hash, is_activated, role, intercom_extension, status) VALUES
('USR-001', 'Dr. Virendra Kumar', 'virendrakumar@wii.gov.in', '9876543210', 'password123', TRUE, 'admin', '001', 'active'),
('USR-002', 'Dr. Ananya Sharma', 'ananya.sharma@wii.gov.in', '9810293847', 'password123', TRUE, 'applicant', '214', 'active'),
('USR-003', 'Dr. R. K. Singh', 'rksingh@wii.gov.in', '9876512345', 'password123', TRUE, 'supervisor', '142', 'active'),
('USR-004', 'Mr. Dinesh Singh Pundir', 'dinesh.pundir@wii.gov.in', '9897123456', 'password123', TRUE, 'it_officer', '138', 'active'),
('USR-005', 'Mr. Harendra Kumar', 'harendra.kumar@wii.gov.in', '9897654321', 'password123', TRUE, 'hrms_officer', '182', 'active'),
('USR-006', 'Dr. S. K. Gupta', 'skgupta@wii.gov.in', '9812345678', 'password123', TRUE, 'lab_nodal', '155', 'active'),
('USR-007', 'Dr. Panna Lal', 'pannalal@wii.gov.in', '9834567890', 'password123', TRUE, 'section_head', '101', 'active'),
('USR-008', 'Dr. Neha Verma', 'neha.verma@wii.gov.in', '9845678901', 'password123', TRUE, 'assoc_lab_nodal', '156', 'active'),
('USR-009', 'Er. Vikas Mehta', 'vikas.mehta@wii.gov.in', '9856789012', 'password123', TRUE, 'hrms_officer', '188', 'active')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 2. Seed Facility Masters Linked via Foreign Keys to Role Officers
INSERT INTO facility_masters (id, facility_name, department, nodal_officer_id, nodal_officer_name, assoc_nodal_officer_id, assoc_nodal_officer_name, supervisor_id, supervisor_name, description, status) VALUES
('FAC-01', 'Wildlife Genetics & Genomics Facility', 'Research Laboratories Division', 'USR-006', 'Dr. S. K. Gupta', 'USR-008', 'Dr. Neha Verma', 'USR-009', 'Er. Vikas Mehta', 'DNA extraction, PCR amplification, NGS sequencing & bio-informatics workstations.', 'active'),
('FAC-02', 'Isotope Ratio Mass Spectrometry (IRMS) Lab', 'Research Laboratories Division', 'USR-006', 'Dr. S. K. Gupta', 'USR-008', 'Dr. Neha Verma', 'USR-009', 'Er. Vikas Mehta', 'Stable isotope analysis for food web, migratory ecology & provenance studies.', 'active'),
('FAC-03', 'Spatial Ecology, RS & GIS High-Performance Computing Lab', 'IT, RS & GIS Cell', 'USR-007', 'Dr. Panna Lal', 'USR-008', 'Dr. Neha Verma', 'USR-009', 'Er. Vikas Mehta', 'High-end GPU spatial modeling, satellite imagery processing & drone mapping server.', 'active'),
('FAC-04', 'Ecotoxicology & Wildlife Forensic Chemistry Lab', 'Research Laboratories Division', 'USR-006', 'Dr. S. K. Gupta', 'USR-008', 'Dr. Neha Verma', 'USR-009', 'Er. Vikas Mehta', 'Heavy metal detection, poison analysis & wildlife crime evidence chemical testing.', 'active')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 3. Seed Service Masters Linked via Foreign Keys to Manager Role Officers
INSERT INTO service_masters (id, service_name, manager_id, manager_name, quota_access_specs, status) VALUES
('SRV-01', 'Institutional Webmail (@wii.gov.in)', 'USR-004', 'Mr. Dinesh Singh Pundir', '10 GB / user mailbox, SMTP/IMAP SSL', 'active'),
('SRV-02', 'High-Speed Campus WiFi & MAC Binding', 'USR-004', 'Mr. Dinesh Singh Pundir', '1 Gbps Fibre Backbone, 2 Devices / User', 'active'),
('SRV-03', 'HRMS ERP & Payroll Portal Account', 'USR-005', 'Mr. Harendra Kumar', 'Biometric Punching, Leave & Appraisal Sync', 'active'),
('SRV-04', 'Bio-Metric Punching Machine Enrolment', 'USR-009', 'Er. Vikas Mehta', 'Main Gate, Admin Block & Lab Entry Terminal', 'active')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Confirm created tables and views
SHOW FULL TABLES WHERE Table_type = 'VIEW';
