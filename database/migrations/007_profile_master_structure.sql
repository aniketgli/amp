-- ============================================================================
-- AMP PROFILE MASTER STRUCTURE
-- Migration 007
-- Final master model for Bank, Designation, Organization, Stream,
-- MSc Batch, Course and Trainee Batch.
--
-- Existing tables/data are preserved. Legacy batch-series/batch structures
-- remain in place until the application is fully migrated to the new model.
-- ============================================================================

-- 1. ORGANIZATION MASTER
ALTER TABLE profile_org_units
    ADD COLUMN unit_code VARCHAR(50) NULL
        COMMENT 'Unique organization code used by the application'
        AFTER unit_name;

CREATE UNIQUE INDEX uq_profile_org_unit_code
    ON profile_org_units (unit_type, unit_code);

-- 2. DESIGNATION MASTER
CREATE TABLE profile_designation_masters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employment_type_id INT UNSIGNED NOT NULL,
    designation_name VARCHAR(200) NOT NULL,
    designation_code VARCHAR(50) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_profile_designation_employment_type
        FOREIGN KEY (employment_type_id)
        REFERENCES profile_employment_types(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_profile_designation_type_name
        (employment_type_id, designation_name),
    UNIQUE KEY uq_profile_designation_type_code
        (employment_type_id, designation_code),
    INDEX idx_profile_designation_status (status),
    INDEX idx_profile_designation_employment_type (employment_type_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 3. STREAM MASTER
CREATE TABLE profile_stream_masters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stream_name VARCHAR(200) NOT NULL,
    stream_code VARCHAR(50) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_profile_stream_name (stream_name),
    UNIQUE KEY uq_profile_stream_code (stream_code),
    INDEX idx_profile_stream_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 4. COURSE MASTER
CREATE TABLE profile_course_masters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(200) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_profile_course_name (course_name),
    UNIQUE KEY uq_profile_course_code (course_code),
    INDEX idx_profile_course_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 5. MSc BATCH MASTER
-- Each batch belongs to one stream. Numbering is independent per stream.
CREATE TABLE profile_msc_batches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stream_id INT UNSIGNED NOT NULL,
    batch_name VARCHAR(100) NOT NULL,
    batch_code VARCHAR(50) NOT NULL,
    validity_start_year SMALLINT UNSIGNED NOT NULL,
    validity_end_year SMALLINT UNSIGNED NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_profile_msc_batch_stream
        FOREIGN KEY (stream_id)
        REFERENCES profile_stream_masters(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_profile_msc_batch_stream_name
        (stream_id, batch_name),
    UNIQUE KEY uq_profile_msc_batch_stream_code
        (stream_id, batch_code),
    INDEX idx_profile_msc_batch_status (status),
    INDEX idx_profile_msc_batch_stream (stream_id),
    INDEX idx_profile_msc_batch_validity
        (validity_start_year, validity_end_year)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 6. TRAINEE BATCH MASTER
-- Each batch belongs to one course. Numbering is independent per course.
CREATE TABLE profile_trainee_batches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    batch_name VARCHAR(100) NOT NULL,
    batch_code VARCHAR(50) NOT NULL,
    validity_start_year SMALLINT UNSIGNED NOT NULL,
    validity_end_year SMALLINT UNSIGNED NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_profile_trainee_batch_course
        FOREIGN KEY (course_id)
        REFERENCES profile_course_masters(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_profile_trainee_batch_course_name
        (course_id, batch_name),
    UNIQUE KEY uq_profile_trainee_batch_course_code
        (course_id, batch_code),
    INDEX idx_profile_trainee_batch_status (status),
    INDEX idx_profile_trainee_batch_course (course_id),
    INDEX idx_profile_trainee_batch_validity
        (validity_start_year, validity_end_year)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 7. NEW MASTER REFERENCES ON APPLICANT PROFILE
-- Legacy columns are preserved for compatibility during migration.
ALTER TABLE applicant_profiles
    ADD COLUMN employment_type_id INT UNSIGNED NULL
        COMMENT 'Final employment type master reference'
        AFTER employment_type,
    ADD COLUMN designation_id INT UNSIGNED NULL
        COMMENT 'Final designation master reference'
        AFTER designation,
    ADD COLUMN organization_id INT UNSIGNED NULL
        COMMENT 'Final organization master reference'
        AFTER project_id,
    ADD COLUMN stream_id INT UNSIGNED NULL
        COMMENT 'Final MSc stream master reference'
        AFTER stream,
    ADD COLUMN course_id INT UNSIGNED NULL
        COMMENT 'Final trainee course master reference'
        AFTER course_name,
    ADD COLUMN msc_batch_id INT UNSIGNED NULL
        COMMENT 'Final MSc batch master reference'
        AFTER batch_id,
    ADD COLUMN trainee_batch_id INT UNSIGNED NULL
        COMMENT 'Final trainee batch master reference'
        AFTER msc_batch_id;

-- 8. INDEXES
ALTER TABLE applicant_profiles
    ADD INDEX idx_profile_employment_type_id (employment_type_id),
    ADD INDEX idx_profile_designation_id (designation_id),
    ADD INDEX idx_profile_organization_id (organization_id),
    ADD INDEX idx_profile_stream_id (stream_id),
    ADD INDEX idx_profile_course_id (course_id),
    ADD INDEX idx_profile_msc_batch_id (msc_batch_id),
    ADD INDEX idx_profile_trainee_batch_id (trainee_batch_id);

-- 9. FOREIGN KEYS
ALTER TABLE applicant_profiles
    ADD CONSTRAINT fk_profile_employment_type_id
        FOREIGN KEY (employment_type_id)
        REFERENCES profile_employment_types(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    ADD CONSTRAINT fk_profile_designation_id
        FOREIGN KEY (designation_id)
        REFERENCES profile_designation_masters(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    ADD CONSTRAINT fk_profile_organization_id
        FOREIGN KEY (organization_id)
        REFERENCES profile_org_units(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    ADD CONSTRAINT fk_profile_stream_id
        FOREIGN KEY (stream_id)
        REFERENCES profile_stream_masters(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    ADD CONSTRAINT fk_profile_course_id
        FOREIGN KEY (course_id)
        REFERENCES profile_course_masters(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    ADD CONSTRAINT fk_profile_msc_batch_id
        FOREIGN KEY (msc_batch_id)
        REFERENCES profile_msc_batches(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    ADD CONSTRAINT fk_profile_trainee_batch_id
        FOREIGN KEY (trainee_batch_id)
        REFERENCES profile_trainee_batches(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
