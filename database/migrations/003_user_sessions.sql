-- ============================================================================
-- AMP - SERVER-SIDE AUTHENTICATION SESSIONS
-- Migration: 003_user_sessions.sql
--
-- Purpose:
--   Replace long-lived stateless browser authentication with revocable,
--   database-backed sessions.
--
-- Security model:
--   - Only a SHA-256 hash of the session token is stored.
--   - The raw session token is sent only to the browser in an HttpOnly cookie.
--   - `expires_at` is the absolute session lifetime boundary.
--   - `last_activity_at` supports an invisible idle-timeout policy.
--   - `revoked_at` provides immediate server-side invalidation.
--   - No session information is intended for frontend display.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    session_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    last_activity_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expires_at DATETIME(3) NOT NULL,
    revoked_at DATETIME(3) NULL,
    revocation_reason VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_sessions_token_hash (session_token_hash),
    KEY idx_user_sessions_user (user_id),
    KEY idx_user_sessions_expiry (expires_at),
    KEY idx_user_sessions_active (user_id, revoked_at, expires_at),

    CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Server-side authentication sessions; raw session tokens are never stored';
