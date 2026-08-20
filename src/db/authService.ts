import crypto from 'crypto';
import { getDbPool } from './connection.js';

// Hash password with SHA-256 + salt
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'wii_portal_salt_2026').digest('hex');
}

// Generate unique User ID e.g. USR-829102
export function generateUserId(): string {
  return 'USR-' + Math.floor(100000 + Math.random() * 900000);
}

// Generate random activation token
export function generateActivationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface RegisterUserInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
  intercomExtension?: string;
}

export async function registerUserInDb(input: RegisterUserInput) {
  const db = getDbPool();
  const userId = generateUserId();
  const passwordHash = hashPassword(input.password);
  const activationToken = generateActivationToken();
  const role = input.role || 'applicant';
  const intercom = input.intercomExtension || '100';

  // Check if email already exists
  const [existing]: any = await db.query('SELECT id FROM users WHERE email = ?', [input.email]);
  if (existing && existing.length > 0) {
    throw new Error('This email address is already registered in the system.');
  }

  // Insert user into users table
  const query = `
    INSERT INTO users (
      id, full_name, email, phone, password_hash, is_activated, activation_token, role, intercom_extension, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await db.query(query, [
    userId,
    input.fullName,
    input.email,
    input.phone,
    passwordHash,
    true, // Activated by default or set false if email confirmation required
    activationToken,
    role,
    intercom,
    'active',
  ]);

  // Return created user (without password hash)
  return {
    id: userId,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    role,
    intercomExtension: intercom,
    status: 'active',
  };
}

export async function loginUserInDb(email: string, password: string) {
  const db = getDbPool();
  const passwordHash = hashPassword(password);

  const [rows]: any = await db.query(
    'SELECT id, full_name, email, phone, role, intercom_extension, status, password_hash FROM users WHERE email = ?',
    [email]
  );

  if (!rows || rows.length === 0) {
    throw new Error('Invalid email or password.');
  }

  const user = rows[0];

  // Compare password hash
  if (user.password_hash !== passwordHash && user.password_hash !== password) {
    throw new Error('Invalid email or password.');
  }

  if (user.status !== 'active') {
    throw new Error('Account is suspended or inactive. Please contact system admin.');
  }

  // Update last active timestamp
  await db.query('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    intercomExtension: user.intercom_extension,
    status: user.status,
  };
}
