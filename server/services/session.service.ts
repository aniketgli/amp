import crypto from "crypto";

import {
  createSession,
  deleteExpiredSessions,
  findActiveSessionByTokenHash,
  revokeAllUserSessions,
  revokeSession,
  updateSessionActivity,
  type UserSessionRecord,
} from "../repositories/session.repository";

// ============================================================
// SERVER-SIDE SESSION SERVICE
// ============================================================
// Business/security rules for authentication sessions.
//
// IMPORTANT:
// - The browser receives only the raw random session token.
// - The database stores only its SHA-256 hash.
// - Session lifetime is intentionally invisible to the frontend.
// - The repository owns database access; this service owns policy.
// ============================================================

/** Invisible idle timeout. */
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/** Absolute maximum lifetime from the moment of login. */
export const SESSION_ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

/** Keep inactive session records for a short maintenance period. */
const SESSION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const SESSION_TOKEN_BYTES = 32;

export interface CreateUserSessionInput {
  userId: number;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthenticatedSession {
  session: UserSessionRecord;
  userId: number;
}

/**
 * Generate a cryptographically secure opaque session token.
 * No identity, role, timestamp or other information is encoded in it.
 */
function generateSessionToken(): string {
  return crypto.randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

/**
 * Hash the browser token before it is persisted or used for lookup.
 */
export function hashSessionToken(sessionToken: string): string {
  return crypto
    .createHash("sha256")
    .update(sessionToken, "utf8")
    .digest("hex");
}

/**
 * Create a new server-side session for an authenticated user.
 */
export async function createUserSession(
  input: CreateUserSessionInput,
): Promise<{ sessionToken: string; sessionId: number; expiresAt: Date }> {
  const userId = Number(input.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("A valid user ID is required to create a session.");
  }

  const sessionToken = generateSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_ABSOLUTE_TIMEOUT_MS);

  const sessionId = await createSession({
    userId,
    sessionTokenHash,
    expiresAt,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });

  return {
    sessionToken,
    sessionId,
    expiresAt,
  };
}

/**
 * Validate a browser session and silently renew its idle window.
 *
 * Absolute expiry is enforced by the repository/database query.
 * Idle expiry is enforced here because it is business policy rather than
 * a property of the token itself.
 */
export async function validateSession(
  sessionToken: string,
): Promise<AuthenticatedSession | null> {
  const cleanToken = String(sessionToken ?? "").trim();

  if (!cleanToken || cleanToken.length < 40 || cleanToken.length > 200) {
    return null;
  }

  const sessionTokenHash = hashSessionToken(cleanToken);
  const session = await findActiveSessionByTokenHash(sessionTokenHash);

  if (!session) {
    return null;
  }

  const now = Date.now();
  const lastActivityAt = new Date(session.last_activity_at).getTime();

  if (!Number.isFinite(lastActivityAt)) {
    return null;
  }

  // Invisible idle timeout. No session details are returned to the client.
  if (now - lastActivityAt >= SESSION_IDLE_TIMEOUT_MS) {
    await revokeSession(session.id, "idle_timeout");
    return null;
  }

  const activityUpdated = await updateSessionActivity(session.id, new Date(now));

  if (!activityUpdated) {
    // Another request/process may have revoked or expired the session.
    return null;
  }

  return {
    session,
    userId: Number(session.user_id),
  };
}

/**
 * Revoke one session, normally used by the logout endpoint.
 */
export async function revokeUserSession(
  sessionToken: string,
  reason = "logout",
): Promise<boolean> {
  const cleanToken = String(sessionToken ?? "").trim();

  if (!cleanToken) {
    return false;
  }

  const session = await findActiveSessionByTokenHash(hashSessionToken(cleanToken));

  if (!session) {
    return false;
  }

  return revokeSession(session.id, reason);
}

/**
 * Revoke every active session for an account.
 * Useful when an account is suspended, credentials are compromised,
 * or an administrator performs an account-wide invalidation.
 */
export async function revokeAllSessionsForUser(
  userId: number,
  reason = "account_invalidation",
): Promise<number> {
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    throw new Error("A valid user ID is required to revoke sessions.");
  }

  return revokeAllUserSessions(normalizedUserId, reason);
}

/**
 * Maintenance operation. Authentication does not depend on this cleanup.
 */
export async function cleanupOldSessions(): Promise<number> {
  const retentionBefore = new Date(Date.now() - SESSION_RETENTION_MS);
  return deleteExpiredSessions(retentionBefore);
}
