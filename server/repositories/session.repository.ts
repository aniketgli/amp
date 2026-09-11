import { db } from "../db/connection";

// ------------------------------------------------------------
// Session Repository
// ------------------------------------------------------------
// Database-only operations for server-side authentication sessions.
// Raw session tokens are never stored here; callers must provide the
// SHA-256 token hash instead.
// ------------------------------------------------------------

export interface CreateSessionInput {
  userId: number;
  sessionTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface UserSessionRecord {
  id: number;
  user_id: number;
  session_token_hash: string;
  created_at: Date;
  last_activity_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  revocation_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Create a new active authentication session.
 */
export async function createSession(
  input: CreateSessionInput,
): Promise<number> {
  const [result]: any = await db.query(
    `INSERT INTO user_sessions (
       user_id,
       session_token_hash,
       expires_at,
       ip_address,
       user_agent
     ) VALUES (?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.sessionTokenHash,
      input.expiresAt,
      input.ipAddress ?? null,
      input.userAgent ?? null,
    ],
  );

  return Number(result.insertId);
}

/**
 * Find a session only when it is currently usable.
 * Revoked and absolutely expired sessions are rejected at the database
 * boundary so callers cannot accidentally treat them as authenticated.
 */
export async function findActiveSessionByTokenHash(
  sessionTokenHash: string,
): Promise<UserSessionRecord | null> {
  const [rows]: any = await db.query(
    `SELECT
       id,
       user_id,
       session_token_hash,
       created_at,
       last_activity_at,
       expires_at,
       revoked_at,
       revocation_reason,
       ip_address,
       user_agent
     FROM user_sessions
     WHERE session_token_hash = ?
       AND revoked_at IS NULL
       AND expires_at > CURRENT_TIMESTAMP(3)
     LIMIT 1`,
    [sessionTokenHash],
  );

  return rows?.[0] || null;
}

/**
 * Record activity for an active session.
 * The service layer decides when the idle window should be renewed.
 */
export async function updateSessionActivity(
  sessionId: number,
  lastActivityAt: Date,
): Promise<boolean> {
  const [result]: any = await db.query(
    `UPDATE user_sessions
     SET last_activity_at = ?
     WHERE id = ?
       AND revoked_at IS NULL
       AND expires_at > CURRENT_TIMESTAMP(3)`,
    [lastActivityAt, sessionId],
  );

  return Number(result.affectedRows) === 1;
}

/**
 * Revoke one session immediately.
 */
export async function revokeSession(
  sessionId: number,
  reason: string,
): Promise<boolean> {
  const [result]: any = await db.query(
    `UPDATE user_sessions
     SET revoked_at = CURRENT_TIMESTAMP(3),
         revocation_reason = ?
     WHERE id = ?
       AND revoked_at IS NULL`,
    [reason, sessionId],
  );

  return Number(result.affectedRows) === 1;
}

/**
 * Revoke all active sessions belonging to a user.
 * Used for account-level invalidation such as "logout all devices" or
 * administrative account suspension.
 */
export async function revokeAllUserSessions(
  userId: number,
  reason: string,
): Promise<number> {
  const [result]: any = await db.query(
    `UPDATE user_sessions
     SET revoked_at = CURRENT_TIMESTAMP(3),
         revocation_reason = ?
     WHERE user_id = ?
       AND revoked_at IS NULL`,
    [reason, userId],
  );

  return Number(result.affectedRows || 0);
}

/**
 * Remove old revoked/expired records so the session table does not grow
 * indefinitely. This is maintenance only; authentication never depends on it.
 */
export async function deleteExpiredSessions(
  retentionBefore: Date,
): Promise<number> {
  const [result]: any = await db.query(
    `DELETE FROM user_sessions
     WHERE (expires_at <= CURRENT_TIMESTAMP(3)
            OR revoked_at IS NOT NULL)
       AND COALESCE(revoked_at, expires_at) < ?`,
    [retentionBefore],
  );

  return Number(result.affectedRows || 0);
}
