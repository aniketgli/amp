-- ============================================================================
-- AMP PROFILE ORGANIZATION UNIT TYPES
-- Migration 009
-- Adds Section and Labs & Facility to the organization master.
-- Existing Department / Cell / Project data is preserved.
-- ============================================================================

ALTER TABLE profile_org_units
    MODIFY COLUMN unit_type ENUM(
        'department',
        'cell',
        'project',
        'section',
        'labs_facility'
    ) NOT NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
