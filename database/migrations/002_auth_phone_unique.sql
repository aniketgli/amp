-- ============================================================
-- Migration: 002_auth_phone_unique
-- Purpose:
--   Enforce unique mobile numbers at database level.
--
-- IMPORTANT:
--   Application-level validation already exists in auth.service.ts.
--   This UNIQUE constraint is the final database-level protection.
-- ============================================================

ALTER TABLE users
    ADD CONSTRAINT uq_users_phone UNIQUE (phone);