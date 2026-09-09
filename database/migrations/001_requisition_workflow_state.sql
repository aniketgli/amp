-- ============================================================================
-- Migration 001: Requisition + Workflow Database Foundation
--
-- IMPORTANT:
-- This migration is intentionally NON-DESTRUCTIVE.
-- It creates only missing tables and does not drop existing data.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Applicant profiles
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
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
    department_cell_project VARCHAR(255) NOT NULL,
    supervising_officer_id INT UNSIGNED NULL,
    supervising_officer_name VARCHAR(150) NOT NULL,
    date_of_joining DATE NULL,
    valid_up_to DATE NULL,
    pan_no VARCHAR(20) NULL,
    bank_name VARCHAR(150) NULL,
    account_no VARCHAR(50) NULL,
    ifsc_code VARCHAR(20) NULL,
    office_order_file_name VARCHAR(255) NULL,
    biometric_id VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (supervising_officer_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_prof_dept (department_cell_project)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 2. Requisitions master
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requisitions (
    id VARCHAR(50) PRIMARY KEY,
    applicant_id INT UNSIGNED NOT NULL,

    requisition_type ENUM(
        'IT_HRMS',
        'LAB_FACILITY',
        'COMBINED'
    ) NOT NULL DEFAULT 'COMBINED',

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
    ) NOT NULL DEFAULT 'submitted_pending_pi',

    requisition_mode ENUM(
        'new',
        'renewal'
    ) NOT NULL DEFAULT 'new',

    renewal_reason TEXT NULL,
    remarks TEXT NULL,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (applicant_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_req_status (status),
    INDEX idx_req_type (requisition_type),
    INDEX idx_req_applicant (applicant_id)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 3. IT / HRMS details
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS it_hrms_details (
    id INT AUTO_INCREMENT PRIMARY KEY,

    requisition_id VARCHAR(50) NOT NULL UNIQUE,

    request_email BOOLEAN DEFAULT FALSE,
    requested_email_prefix VARCHAR(100) NULL,
    requested_email_groups TEXT NULL,

    request_internet BOOLEAN DEFAULT FALSE,
    device_type VARCHAR(100) NULL,
    mac_address VARCHAR(50) NULL,

    request_hrms_pms BOOLEAN DEFAULT FALSE,
    request_biometric BOOLEAN DEFAULT FALSE,

    provisioned_email VARCHAR(150) NULL,
    provisioned_mac VARCHAR(50) NULL,
    provisioned_hrms_id VARCHAR(50) NULL,
    provisioned_biometric_id VARCHAR(50) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (requisition_id)
        REFERENCES requisitions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 4. Lab facility details
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_facility_details (
    id INT AUTO_INCREMENT PRIMARY KEY,

    requisition_id VARCHAR(50) NOT NULL,
    facility_id VARCHAR(50) NOT NULL,
    facility_name VARCHAR(255) NOT NULL,

    purpose_equipment TEXT NULL,
    from_date DATE NULL,
    to_date DATE NULL,

    has_biometric_id BOOLEAN DEFAULT FALSE,
    biometric_id_number VARCHAR(50) NULL,

    assigned_lab_pass_id VARCHAR(100) NULL,

    nodal_approval_status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    remarks TEXT NULL,

    reviewed_by_id INT UNSIGNED NULL,
    reviewed_by VARCHAR(150) NULL,
    reviewed_at DATETIME NULL,

    nodal_officer_name VARCHAR(150) NULL,
    action_date DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (requisition_id)
        REFERENCES requisitions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (facility_id)
        REFERENCES facility_masters(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (reviewed_by_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_lab_req (requisition_id),
    INDEX idx_lab_status (nodal_approval_status)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 5. Workflow audit history
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    requisition_id VARCHAR(50) NOT NULL,

    actor_id INT UNSIGNED NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,

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

    FOREIGN KEY (requisition_id)
        REFERENCES requisitions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (actor_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_audit_req (requisition_id),
    INDEX idx_audit_action (action_type)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 6. Current workflow state
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requisition_workflow_states (
    requisition_id VARCHAR(50) PRIMARY KEY,

    pi_status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    pi_officer_id INT UNSIGNED NULL,
    pi_officer_name VARCHAR(150) NULL,
    pi_comments TEXT NULL,
    pi_timestamp DATETIME NULL,
    pi_signature VARCHAR(255) NULL,

    section_head_status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    section_head_officer_id INT UNSIGNED NULL,
    section_head_officer_name VARCHAR(150) NULL,
    section_head_comments TEXT NULL,
    section_head_timestamp DATETIME NULL,
    section_head_signature VARCHAR(255) NULL,

    email_net_status ENUM(
        'pending',
        'verified',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    email_net_officer_id INT UNSIGNED NULL,
    email_net_officer_name VARCHAR(150) NULL,
    email_net_comments TEXT NULL,
    email_net_timestamp DATETIME NULL,

    hrms_status ENUM(
        'pending',
        'verified',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    hrms_officer_id INT UNSIGNED NULL,
    hrms_officer_name VARCHAR(150) NULL,
    hrms_comments TEXT NULL,
    hrms_timestamp DATETIME NULL,

    biometric_status ENUM(
        'pending',
        'verified',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    biometric_officer_id INT UNSIGNED NULL,
    biometric_officer_name VARCHAR(150) NULL,
    biometric_comments TEXT NULL,
    biometric_timestamp DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (requisition_id)
        REFERENCES requisitions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

