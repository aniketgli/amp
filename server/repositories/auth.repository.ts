import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import crypto from "crypto";

import { db } from "../db/connection";

// ============================================================
// AUTH REPOSITORY
// ============================================================
//
// Database-only layer.
//
// Responsibilities:
// - User lookup
// - Duplicate email/mobile lookup
// - User creation
// - Default role assignment
// - Activation token lookup
// - Account activation
// - Role lookup
//
// NOT responsible for:
// - HTTP
// - JWT
// - bcrypt
// - Email
// - Frontend/localStorage
//
// DATABASE IS THE SOURCE OF TRUTH.
// ============================================================

export interface AuthUserRecord {
  id: number;
  employee_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  is_activated: number | boolean;
  activation_token: string | null;
  intercom_extension: string | null;
  status: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface AuthRoleRecord {
  id: number;
  code: string;
  name: string;
}

interface AuthUserRow extends RowDataPacket, AuthUserRecord {}

interface AuthRoleRow extends RowDataPacket, AuthRoleRecord {}

export interface CreateAuthUserInput {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;

  // Raw token is received from the service.
  // Repository hashes it before database persistence.
  activationToken: string;
}

export interface CreatedAuthUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_activated: boolean;
  activation_token: string | null;
  status: string;
}

// ============================================================
// ACTIVATION TOKEN HASH
// ============================================================
//
// Raw activation token:
//   - exists only in the email/link flow
//   - is NEVER stored directly in DB
//
// DB stores:
//   SHA-256(raw token)
//
// The raw token remains usable by the recipient because the
// repository hashes the incoming token before comparison.
// ============================================================

function hashActivationToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

// ============================================================
// FIND USER FOR LOGIN
// ============================================================

export async function findUserForLogin(
  identifier: string,
): Promise<AuthUserRecord | null> {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  if (!normalizedIdentifier) {
    return null;
  }

  const [rows] = await db.query<AuthUserRow[]>(
    `SELECT
       id,
       employee_id,
       full_name,
       email,
       phone,
       password_hash,
       is_activated,
       activation_token,
       intercom_extension,
       status,
       created_at,
       updated_at
     FROM users
     WHERE LOWER(email) = ?
        OR LOWER(employee_id) = ?
     LIMIT 1`,
    [normalizedIdentifier, normalizedIdentifier],
  );

  return rows[0] || null;
}

// ============================================================
// FIND USER BY EMAIL
// ============================================================
//
// Used during registration to provide a clear duplicate-account
// response before attempting INSERT.
//
// The database UNIQUE constraint remains the final safeguard.
// ============================================================

export async function findUserByEmail(email: string): Promise<{
  id: number;
  email: string;
  status: string;
  is_activated: boolean;
} | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       id,
       email,
       status,
       is_activated
     FROM users
     WHERE LOWER(email) = ?
     LIMIT 1`,
    [normalizedEmail],
  );

  if (!rows[0]) {
    return null;
  }

  return {
    id: Number(rows[0].id),
    email: String(rows[0].email),
    status: String(rows[0].status),
    is_activated: Boolean(rows[0].is_activated),
  };
}

// ============================================================
// FIND USER BY MOBILE NUMBER
// ============================================================
//
// Registration rule:
//   - Mobile number must be unique.
//
// IMPORTANT:
// This is an application-level duplicate check only.
// The final guarantee will also be enforced by a DATABASE
// UNIQUE constraint in the next migration step.
//
// Phone numbers are normalized by removing non-digit characters
// so values such as:
//   9876543210
//   98765-43210
//   +91 9876543210
//
// can be compared consistently after normalization.
// ============================================================

export async function findUserByPhone(phone: string): Promise<{
  id: number;
  phone: string;
  email: string;
  status: string;
  is_activated: boolean;
} | null> {
  const normalizedPhone = phone.replace(/\D/g, "").trim();

  if (!normalizedPhone) {
    return null;
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       id,
       phone,
       email,
       status,
       is_activated
     FROM users
     WHERE phone = ?
     LIMIT 1`,
    [normalizedPhone],
  );

  if (!rows[0]) {
    return null;
  }

  return {
    id: Number(rows[0].id),
    phone: String(rows[0].phone),
    email: String(rows[0].email),
    status: String(rows[0].status),
    is_activated: Boolean(rows[0].is_activated),
  };
}

// ============================================================
// GET ACTIVE USER ROLES
// ============================================================
//
// Authoritative source:
//   user_roles -> roles
//
// Frontend role state is never trusted.
// ============================================================

export async function getActiveUserRoles(
  userId: number,
): Promise<AuthRoleRecord[]> {
  const [rows] = await db.query<AuthRoleRow[]>(
    `SELECT
       r.id,
       r.role_code AS code,
       r.role_name AS name
     FROM user_roles ur
     INNER JOIN roles r
       ON r.id = ur.role_id
     WHERE ur.user_id = ?
       AND r.is_active = 1
     ORDER BY r.id ASC`,
    [userId],
  );

  return rows.map((role) => ({
    id: Number(role.id),
    code: String(role.code || "").trim(),
    name: String(role.name || "").trim(),
  }));
}

// ============================================================
// CREATE USER + DEFAULT USER ROLE
// ============================================================
//
// IMPORTANT:
// Role ID is NEVER hard-coded.
//
// DB role_code = "user" is authoritative.
// User creation + role assignment happen in one transaction.
// ============================================================

export async function createUserWithDefaultRole(
  input: CreateAuthUserInput,
): Promise<CreatedAuthUser> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // ----------------------------------------------------------
    // 1. Resolve default role from DB.
    // ----------------------------------------------------------

    const [roleRows] = await connection.query<RowDataPacket[]>(
      `SELECT
         id,
         role_code,
         role_name
       FROM roles
       WHERE LOWER(role_code) = ?
         AND is_active = 1
       LIMIT 1
       FOR UPDATE`,
      ["user"],
    );

    if (!roleRows.length) {
      throw new Error(
        'Default registration role "user" is missing or inactive.',
      );
    }

    const roleId = Number(roleRows[0].id);

    if (!Number.isInteger(roleId) || roleId <= 0) {
      throw new Error("Invalid default registration role.");
    }

    // ----------------------------------------------------------
    // 2. Hash activation token before DB persistence.
    // ----------------------------------------------------------

    const activationTokenHash = hashActivationToken(input.activationToken);

    // ----------------------------------------------------------
    // 3. Create inactive account.
    // ----------------------------------------------------------

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO users
       (
         employee_id,
         full_name,
         email,
         phone,
         password_hash,
         is_activated,
         activation_token,
         status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null,
        input.fullName.trim(),
        input.email.trim().toLowerCase(),
        input.phone.replace(/\D/g, "").trim(),
        input.passwordHash,
        0,
        activationTokenHash,
        "inactive",
      ],
    );

    const userId = Number(result.insertId);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error("Unable to obtain the newly created user ID.");
    }

    // ----------------------------------------------------------
    // 4. Assign default "user" role.
    // ----------------------------------------------------------

    await connection.execute(
      `INSERT INTO user_roles
       (
         user_id,
         role_id
       )
       VALUES (?, ?)`,
      [userId, roleId],
    );

    // ----------------------------------------------------------
    // 5. Commit user + role atomically.
    // ----------------------------------------------------------

    await connection.commit();

    return {
      id: userId,
      full_name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.replace(/\D/g, "").trim(),
      is_activated: false,

      // Do not expose this value as a DB value.
      // Service still owns the raw token for the email flow.
      activation_token: input.activationToken,

      status: "inactive",
    };
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

// ============================================================
// FIND USER BY ACTIVATION TOKEN
// ============================================================
//
// Incoming token is RAW.
// Database contains SHA-256 hash.
//
// Therefore:
//
// raw token
//    ↓
// SHA-256
//    ↓
// DB comparison
// ============================================================

export async function findUserByActivationToken(
  activationToken: string,
): Promise<{
  id: number;
  employee_id: string | null;
  full_name: string;
  email: string;
  is_activated: boolean;
  activation_token: string | null;
  status: string;
} | null> {
  const cleanToken = activationToken.trim();

  if (!cleanToken) {
    return null;
  }

  const activationTokenHash = hashActivationToken(cleanToken);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       id,
       employee_id,
       full_name,
       email,
       is_activated,
       activation_token,
       status
     FROM users
     WHERE activation_token = ?
     LIMIT 1`,
    [activationTokenHash],
  );

  if (!rows[0]) {
    return null;
  }

  return {
    id: Number(rows[0].id),
    employee_id: rows[0].employee_id ? String(rows[0].employee_id) : null,
    full_name: String(rows[0].full_name),
    email: String(rows[0].email),
    is_activated: Boolean(rows[0].is_activated),

    // This is intentionally the DB hash.
    // It is never returned to the frontend.
    activation_token: rows[0].activation_token
      ? String(rows[0].activation_token)
      : null,

    status: String(rows[0].status),
  };
}

// ============================================================
// ACTIVATE ACCOUNT
// ============================================================
//
// Activation is one-time.
//
// Once successful:
//   is_activated = 1
//   status        = active
//   activation_token = NULL
//
// Therefore the same activation link cannot be reused.
// ============================================================

export async function activateUserAccount(userId: number): Promise<boolean> {
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE users
     SET
       is_activated = 1,
       status = 'active',
       activation_token = NULL,
       updated_at = NOW()
     WHERE id = ?
       AND is_activated = 0
       AND activation_token IS NOT NULL
     LIMIT 1`,
    [userId],
  );

  return result.affectedRows === 1;
}

// ============================================================
// GET SAFE USER AFTER ACTIVATION
// ============================================================
//
// Never returns:
// - password_hash
// - activation_token
// ============================================================

export async function getActivatedUserById(userId: number): Promise<{
  id: number;
  employee_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  intercom_extension: string | null;
  status: string;
  is_activated: boolean;
} | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       id,
       employee_id,
       full_name,
       email,
       phone,
       intercom_extension,
       status,
       is_activated
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId],
  );

  if (!rows[0]) {
    return null;
  }

  return {
    id: Number(rows[0].id),
    employee_id: rows[0].employee_id ? String(rows[0].employee_id) : null,
    full_name: String(rows[0].full_name),
    email: String(rows[0].email),
    phone: String(rows[0].phone),
    intercom_extension: rows[0].intercom_extension
      ? String(rows[0].intercom_extension)
      : null,
    status: String(rows[0].status),
    is_activated: Boolean(rows[0].is_activated),
  };
}

// ============================================================
// GET CURRENT AUTHENTICATED USER
// ============================================================
//
// Used by /api/me.
//
// The JWT identifies the user, but the database confirms the
// current account state and current roles.
// ============================================================

export async function getAuthenticatedUserById(userId: number): Promise<{
  id: number;
  employee_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  intercom_extension: string | null;
  status: string;
  is_activated: boolean;
} | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       id,
       employee_id,
       full_name,
       email,
       phone,
       intercom_extension,
       status,
       is_activated
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId],
  );

  if (!rows[0]) {
    return null;
  }

  return {
    id: Number(rows[0].id),
    employee_id: rows[0].employee_id ? String(rows[0].employee_id) : null,
    full_name: String(rows[0].full_name),
    email: String(rows[0].email),
    phone: String(rows[0].phone),
    intercom_extension: rows[0].intercom_extension
      ? String(rows[0].intercom_extension)
      : null,
    status: String(rows[0].status),
    is_activated: Boolean(rows[0].is_activated),
  };
}
