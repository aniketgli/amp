-- ============================================================================
-- AMP PROFILE MODULE
-- Migration 004
-- Backend + Database are the source of truth.
-- Existing tables/data are preserved.
-- ============================================================================

-- ============================================================================
-- 1. APPLICANT PROFILE CORE FIELDS
-- ============================================================================

ALTER TABLE applicant_profiles
    ADD COLUMN employment_type VARCHAR(50) NULL
        COMMENT 'Employment type controlled by backend master rules'
        AFTER applicant_name;

ALTER TABLE applicant_profiles
    ADD COLUMN profile_photo_path VARCHAR(500) NULL
        COMMENT 'Server-side stored profile photo reference'
        AFTER salutation;

ALTER TABLE applicant_profiles
    ADD COLUMN stream VARCHAR(150) NULL
        COMMENT 'Academic stream for MSc students'
        AFTER designation;

ALTER TABLE applicant_profiles
    ADD COLUMN course_name VARCHAR(200) NULL
        COMMENT 'Course name for Diploma Trainees'
        AFTER stream;

ALTER TABLE applicant_profiles
    ADD COLUMN department_id INT UNSIGNED NULL
        COMMENT 'Department/Cell master reference'
        AFTER department_cell_project;

ALTER TABLE applicant_profiles
    ADD COLUMN project_id INT UNSIGNED NULL
        COMMENT 'Project master reference'
        AFTER department_id;

ALTER TABLE applicant_profiles
    ADD COLUMN reporting_officer_id INT UNSIGNED NULL
        COMMENT 'Reporting Officer master/user reference'
        AFTER project_id;

ALTER TABLE applicant_profiles
    ADD COLUMN reporting_manager_id INT UNSIGNED NULL
        COMMENT 'Reporting Manager / PI reference'
        AFTER reporting_officer_id;

ALTER TABLE applicant_profiles
    ADD COLUMN pi_user_id INT UNSIGNED NULL
        COMMENT 'Principal Investigator reference'
        AFTER reporting_manager_id;

ALTER TABLE applicant_profiles
    ADD COLUMN batch_id INT UNSIGNED NULL
        COMMENT 'Academic/trainee batch master reference'
        AFTER pi_user_id;

ALTER TABLE applicant_profiles
    ADD INDEX idx_profile_employment_type (employment_type);

ALTER TABLE applicant_profiles
    ADD INDEX idx_profile_department (department_id);

ALTER TABLE applicant_profiles
    ADD INDEX idx_profile_project (project_id);

ALTER TABLE applicant_profiles
    ADD INDEX idx_profile_reporting_officer (reporting_officer_id);

ALTER TABLE applicant_profiles
    ADD INDEX idx_profile_reporting_manager (reporting_manager_id);

ALTER TABLE applicant_profiles
    ADD INDEX idx_profile_pi (pi_user_id);

ALTER TABLE applicant_profiles
    ADD INDEX idx_profile_batch (batch_id);


-- ============================================================================
-- 2. PROFILE ORGANISATIONAL MASTER
-- Department / Cell / Project
-- ============================================================================

CREATE TABLE profile_org_units (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    unit_type ENUM(
        'department',
        'cell',
        'project'
    ) NOT NULL,

    unit_name VARCHAR(255) NOT NULL,

    description VARCHAR(500) NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_profile_org_unit (unit_type, unit_name),
    INDEX idx_profile_org_unit_type (unit_type),
    INDEX idx_profile_org_unit_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Backend controlled Department, Cell and Project master data';


-- ============================================================================
-- 3. BANK MASTER
-- ============================================================================

CREATE TABLE profile_bank_masters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    bank_name VARCHAR(200) NOT NULL,

    bank_code VARCHAR(50) NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_profile_bank_name (bank_name),
    INDEX idx_profile_bank_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Backend controlled bank master';


-- ============================================================================
-- 4. ACADEMIC / TRAINEE BATCH SERIES
--
-- MSc and Diploma Trainee batches intentionally use separate series.
-- Example:
-- MSc:
--   20th batch 2026-28
--   21st batch 2027-29
--
-- Diploma:
--   20th batch 2026-28
--   21st batch 2027-29
--
-- The numbering is therefore NOT shared between the two categories.
-- ============================================================================

CREATE TABLE profile_batch_series (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    series_type ENUM(
        'msc',
        'diploma_trainee'
    ) NOT NULL,

    series_name VARCHAR(100) NOT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_profile_batch_series (series_type, series_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Separate batch numbering series for MSc and Diploma Trainees';


CREATE TABLE profile_batches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    series_id INT UNSIGNED NOT NULL,

    batch_number INT UNSIGNED NOT NULL,

    batch_label VARCHAR(100) NOT NULL,

    start_year SMALLINT UNSIGNED NOT NULL,

    end_year SMALLINT UNSIGNED NOT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_profile_batch_series
        FOREIGN KEY (series_id)
        REFERENCES profile_batch_series(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_profile_batch_number (series_id, batch_number),
    UNIQUE KEY uq_profile_batch_label (series_id, batch_label),

    INDEX idx_profile_batch_status (status),
    INDEX idx_profile_batch_years (start_year, end_year)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Backend controlled MSc and Diploma Trainee batches';


-- ============================================================================
-- 5. PROFILE CHANGE HISTORY
--
-- Every successful profile modification will be recorded by backend.
--
-- old_values / new_values:
--   JSON payload containing changed fields only.
--
-- Sensitive values such as PAN, bank account and other confidential
-- information MUST be redacted/tokenized by backend before insertion.
-- ============================================================================

CREATE TABLE profile_change_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL
        COMMENT 'Profile owner',

    changed_by_user_id INT UNSIGNED NOT NULL
        COMMENT 'Authenticated user who performed the change',

    action_type ENUM(
        'CREATE',
        'UPDATE',
        'ADMIN_UPDATE'
    ) NOT NULL,

    changed_fields JSON NOT NULL
        COMMENT 'List/object of fields changed',

    old_values JSON NULL
        COMMENT 'Previous values; sensitive fields are redacted by backend',

    new_values JSON NULL
        COMMENT 'New values; sensitive fields are redacted by backend',

    ip_address VARCHAR(45) NULL,

    user_agent VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_profile_history_user (user_id),
    INDEX idx_profile_history_actor (changed_by_user_id),
    INDEX idx_profile_history_created (created_at),

    CONSTRAINT fk_profile_history_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_profile_history_actor
        FOREIGN KEY (changed_by_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable-style audit history for applicant profile changes';


-- ============================================================================
-- 6. PROFILE EMPLOYMENT TYPE MASTER
--
-- Backend will use this as the authoritative list.
-- Frontend must not define its own authoritative list.
-- ============================================================================

CREATE TABLE profile_employment_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(50) NOT NULL,

    display_name VARCHAR(100) NOT NULL,

    status ENUM(
        'active',
        'inactive'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_profile_employment_code (code),
    UNIQUE KEY uq_profile_employment_name (display_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Authoritative employment type master';


INSERT INTO profile_employment_types
    (code, display_name)
VALUES
    ('PERMANENT', 'Permanent'),
    ('DEPUTATION', 'Deputation'),
    ('CONTRACTUAL', 'Contractual'),
    ('RESEARCHER_PROJECT_STAFF', 'Researcher / Project Staff'),
    ('MSC_STUDENT', 'MSc Student'),
    ('PHD_SCHOLAR', 'PhD Scholar'),
    ('DIPLOMA_TRAINEE', 'Diploma Trainee'),
    ('INTERN', 'Intern');


-- ============================================================================
-- 7. PROFILE FOREIGN KEYS
--
-- These are added only after the master tables exist.
-- ============================================================================

ALTER TABLE applicant_profiles
    ADD CONSTRAINT fk_profile_department
        FOREIGN KEY (department_id)
        REFERENCES profile_org_units(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

ALTER TABLE applicant_profiles
    ADD CONSTRAINT fk_profile_project
        FOREIGN KEY (project_id)
        REFERENCES profile_org_units(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

ALTER TABLE applicant_profiles
    ADD CONSTRAINT fk_profile_reporting_officer
        FOREIGN KEY (reporting_officer_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

ALTER TABLE applicant_profiles
    ADD CONSTRAINT fk_profile_reporting_manager
        FOREIGN KEY (reporting_manager_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

ALTER TABLE applicant_profiles
    ADD CONSTRAINT fk_profile_pi
        FOREIGN KEY (pi_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

ALTER TABLE applicant_profiles
    ADD CONSTRAINT fk_profile_batch
        FOREIGN KEY (batch_id)
        REFERENCES profile_batches(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

