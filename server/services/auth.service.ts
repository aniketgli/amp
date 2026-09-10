import bcrypt from "bcryptjs";
import crypto from "crypto";

import {
  createUserWithDefaultRole,
  findUserByActivationToken,
  findUserByEmail,
  findUserByPhone,
  findUserForLogin,
  getActivatedUserById,
  getActiveUserRoles,
  getAuthenticatedUserById,
  type AuthRoleRecord,
  type AuthUserRecord,
} from "../repositories/auth.repository";

// ============================================================
// AUTH SERVICE
// ============================================================
//
// Business logic for:
//   1. Registration
//   2. Account activation
//   3. Login
//   4. Current authenticated user
//
// IMPORTANT:
// - Repository handles database access.
// - Service handles business rules.
// - Controller will handle HTTP.
// - Email sending will be handled by email.service.ts.
// ============================================================

// ============================================================
// TYPES
// ============================================================

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  userId?: number;
  email?: string;
  activationToken?: string;
}

export interface ActivateResult {
  success: boolean;
  alreadyActivated?: boolean;
  message: string;
  user?: {
    id: number;
    employeeId: string | null;
    fullName: string;
    email: string;
  };
}

export interface LoginInput {
  email: string;
  password: string;
  requestedRole?: string;
}

export interface LoginUserResponse {
  id: number;
  employeeId: string | null;
  fullName: string;
  email: string;
  phone: string;
  intercomExtension: string | null;
  status: string;
  isActivated: boolean;
  roles: AuthRoleRecord[];
}

export interface LoginResult {
  success: boolean;
  message: string;

  /**
   * JWT creation will be performed by the controller/session layer.
   *
   * The service returns the authenticated identity and selected role.
   */
  user: LoginUserResponse;
  currentRole: AuthRoleRecord;
}

export interface CurrentUserResult {
  user: LoginUserResponse;
}

// ============================================================
// VALIDATION CONSTANTS
// ============================================================

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;

const MAX_NAME_LENGTH = 150;
const MAX_EMAIL_LENGTH = 150;
const MAX_PHONE_LENGTH = 15;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

// ============================================================
// HELPERS
// ============================================================

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeRoleCode(roleCode: string): string {
  return String(roleCode || "")
    .trim()
    .toLowerCase();
}

/**
 * Backend-side registration validation.
 *
 * Frontend may validate for user experience, but these checks
 * remain mandatory here because the backend is authoritative.
 */
function validateRegistrationInput(input: RegisterInput): void {
  const fullName = String(input.fullName ?? "").trim();
  const email = normalizeEmail(String(input.email ?? ""));
  const phone = normalizePhone(String(input.phone ?? ""));
  const password = String(input.password ?? "");

  if (!fullName || !email || !phone || !password) {
    throw new Error("All required registration fields are required.");
  }

  if (fullName.length > MAX_NAME_LENGTH) {
    throw new Error(`Full name must not exceed ${MAX_NAME_LENGTH} characters.`);
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    throw new Error(
      `Email address must not exceed ${MAX_EMAIL_LENGTH} characters.`,
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Please provide a valid email address.");
  }

  if (phone.length > MAX_PHONE_LENGTH) {
    throw new Error(`Phone number must not exceed ${MAX_PHONE_LENGTH} digits.`);
  }

  if (!INDIAN_MOBILE_PATTERN.test(phone)) {
    throw new Error(
      "Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
    );
  }

  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    throw new Error(
      `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    );
  }
}

/**
 * Resolve requested frontend/legacy role aliases to authoritative
 * backend role codes.
 *
 * The resulting role is still checked against the user's DB roles.
 */
const ROLE_ALIASES: Record<string, string> = {
  user: "user",
  applicant: "user",

  reporting_manager: "supervisor",
  supervisor: "supervisor",

  nodal_officer: "lab_nodal",
  lab_nodal: "lab_nodal",

  associate_nodal_officer: "assoc_lab_nodal",
  assoc_lab_nodal: "assoc_lab_nodal",

  it_head: "it_officer",
  it_officer: "it_officer",

  manager: "section_head",
  section_head: "section_head",

  hrms_officer: "hrms_officer",

  administrator: "admin",
  admin: "admin",

  super_admin: "super_admin",
};

function resolveRoleAlias(roleCode: string): string | undefined {
  const normalized = normalizeRoleCode(roleCode);

  if (!normalized) {
    return undefined;
  }

  return ROLE_ALIASES[normalized];
}

/**
 * Select default login role.
 *
 * For a normal fresh login we prefer "user".
 * For users who do not have "user", the first assigned active role
 * from the database becomes the fallback.
 *
 * No role is granted from frontend data.
 */
function selectDefaultRole(roles: AuthRoleRecord[]): AuthRoleRecord | null {
  const userRole = roles.find(
    (role) => normalizeRoleCode(role.code) === "user",
  );

  return userRole || roles[0] || null;
}

/**
 * Convert database user record into a safe response.
 */
function toLoginUserResponse(
  user: Pick<
    AuthUserRecord,
    | "id"
    | "employee_id"
    | "full_name"
    | "email"
    | "phone"
    | "intercom_extension"
    | "status"
    | "is_activated"
  >,
  roles: AuthRoleRecord[],
): LoginUserResponse {
  return {
    id: Number(user.id),
    employeeId: user.employee_id ? String(user.employee_id) : null,
    fullName: String(user.full_name),
    email: String(user.email),
    phone: String(user.phone),
    intercomExtension: user.intercom_extension
      ? String(user.intercom_extension)
      : null,
    status: String(user.status),
    isActivated: Boolean(user.is_activated),
    roles,
  };
}

// ============================================================
// REGISTRATION
// ============================================================

/**
 * Register a new portal user.
 *
 * Final business rules:
 * - Account starts inactive.
 * - Password is hashed before persistence.
 * - Activation token is generated server-side.
 * - Default role comes from DB role_code = "user".
 * - Database remains source of truth.
 */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  const normalizedInput: RegisterInput = {
    fullName: String(input.fullName ?? "").trim(),
    email: normalizeEmail(String(input.email ?? "")),
    phone: normalizePhone(String(input.phone ?? "")),
    password: String(input.password ?? ""),
  };

  validateRegistrationInput(normalizedInput);

  // ----------------------------------------------------------
  // Check existing account.
  // ----------------------------------------------------------

  const existingUser = await findUserByEmail(normalizedInput.email);

  if (existingUser) {
    if (!existingUser.is_activated) {
      return {
        success: false,
        message:
          "An account with this email already exists and is not activated. Please use the activation link sent to your email.",
      };
    }

    return {
      success: false,
      message: "An account with this email already exists. Please log in.",
    };
  }

  // ----------------------------------------------------------
  // Check duplicate mobile number.
  //
  // This is an application-level check for a clear user-facing
  // message. The database UNIQUE constraint added in the next
  // migration remains the final protection against duplicates.
  // ----------------------------------------------------------

  const existingPhone = await findUserByPhone(normalizedInput.phone);

  if (existingPhone) {
    return {
      success: false,
      message:
        "An account with this mobile number already exists. Please use a different mobile number.",
    };
  }

  // ----------------------------------------------------------
  // Hash password.
  // ----------------------------------------------------------

  const passwordHash = await bcrypt.hash(normalizedInput.password, 12);

  // ----------------------------------------------------------
  // Generate activation token.
  //
  // Token is generated server-side and is never generated by
  // the frontend.
  // ----------------------------------------------------------

  const activationToken = crypto.randomUUID();

  // ----------------------------------------------------------
  // Create user + default DB role atomically.
  // ----------------------------------------------------------

  let createdUser;

  try {
    createdUser = await createUserWithDefaultRole({
      fullName: normalizedInput.fullName,
      email: normalizedInput.email,
      phone: normalizedInput.phone,
      passwordHash,
      activationToken,
    });
  } catch (error: any) {
    // --------------------------------------------------------
    // Handle DB duplicate-key race conditions safely.
    //
    // The database UNIQUE constraints remain authoritative.
    // MySQL error messages/keys are used only to provide the
    // appropriate user-facing message.
    // --------------------------------------------------------

    if (error?.code === "ER_DUP_ENTRY" || error?.errno === 1062) {
      const duplicateMessage = String(
        error?.sqlMessage || error?.message || "",
      ).toLowerCase();

      if (duplicateMessage.includes("phone")) {
        return {
          success: false,
          message:
            "An account with this mobile number already exists. Please use a different mobile number.",
        };
      }

      return {
        success: false,
        message: "An account with this email already exists.",
      };
    }

    throw error;
  }

  return {
    success: true,
    message:
      "Registration successful. Please check your email for the account activation link.",
    userId: createdUser.id,
    email: createdUser.email,

    // Temporary internal result.
    // Controller/email layer will consume this and will not
    // expose the activation token in the normal API response.
    activationToken,
  };
}

// ============================================================
// ACTIVATION
// ============================================================

/**
 * Activate an account using the server-issued activation token.
 */
export async function activate(
  activationToken: string,
): Promise<ActivateResult> {
  const cleanToken = String(activationToken ?? "").trim();

  if (!cleanToken) {
    throw new Error("Activation token is required.");
  }

  const user = await findUserByActivationToken(cleanToken);

  if (!user) {
    return {
      success: false,
      message: "Invalid or expired activation link.",
    };
  }

  // ----------------------------------------------------------
  // Already activated.
  //
  // This is treated idempotently as a successful activation
  // state, but the token has already been invalidated.
  // ----------------------------------------------------------

  if (Boolean(user.is_activated) && !user.activation_token) {
    return {
      success: true,
      alreadyActivated: true,
      message: "Your account is already activated. You can now log in.",
      user: {
        id: Number(user.id),
        employeeId: user.employee_id ? String(user.employee_id) : null,
        fullName: String(user.full_name),
        email: String(user.email),
      },
    };
  }

  // ----------------------------------------------------------
  // Account should normally be inactive at this stage.
  // ----------------------------------------------------------

  if (String(user.status).toLowerCase() === "suspended") {
    return {
      success: false,
      message: "This account is suspended. Please contact the administrator.",
    };
  }

  // ----------------------------------------------------------
  // Perform activation.
  // ----------------------------------------------------------

  const activated = await import("../repositories/auth.repository").then(
    (repository) => repository.activateUserAccount(Number(user.id)),
  );

  if (!activated) {
    throw new Error("Unable to activate the account.");
  }

  const safeUser = await getActivatedUserById(Number(user.id));

  if (!safeUser) {
    throw new Error("Account was activated but could not be reloaded.");
  }

  return {
    success: true,
    alreadyActivated: false,
    message: "Account activated successfully. You can now log in.",
    user: {
      id: safeUser.id,
      employeeId: safeUser.employee_id,
      fullName: safeUser.full_name,
      email: safeUser.email,
    },
  };
}

// ============================================================
// LOGIN
// ============================================================

/**
 * Authenticate a user using database-backed credentials.
 *
 * Final rules:
 * - User must exist.
 * - Account must be activated.
 * - Account status must be active.
 * - Password must match bcrypt hash.
 * - User must have at least one active DB role.
 * - Requested role must be assigned to that user.
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const email = normalizeEmail(String(input.email ?? ""));

  const password = String(input.password ?? "");

  const requestedRole = normalizeRoleCode(String(input.requestedRole ?? ""));

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    throw new Error("Email address is too long.");
  }

  // ----------------------------------------------------------
  // Load account from DB.
  // ----------------------------------------------------------

  const user = await findUserForLogin(email);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  // ----------------------------------------------------------
  // Account status check BEFORE creating authenticated state.
  // ----------------------------------------------------------

  if (!Boolean(user.is_activated)) {
    throw new Error(
      "Your account is not activated. Please activate your account first.",
    );
  }

  if (String(user.status).toLowerCase() !== "active") {
    throw new Error(
      "Your account is not active. Please contact the administrator.",
    );
  }

  // ----------------------------------------------------------
  // Password verification.
  // ----------------------------------------------------------

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new Error("Invalid email or password.");
  }

  // ----------------------------------------------------------
  // Load current active roles from DB.
  // ----------------------------------------------------------

  const roles = await getActiveUserRoles(Number(user.id));

  if (!roles.length) {
    throw new Error(
      "No active role is assigned to this account. Please contact the administrator.",
    );
  }

  // ----------------------------------------------------------
  // Resolve requested role.
  // ----------------------------------------------------------

  let selectedRole: AuthRoleRecord | null = null;

  if (requestedRole) {
    const authoritativeRequestedRole = resolveRoleAlias(requestedRole);

    if (!authoritativeRequestedRole) {
      throw new Error("Requested role is not supported by the application.");
    }

    selectedRole =
      roles.find(
        (role) => normalizeRoleCode(role.code) === authoritativeRequestedRole,
      ) || null;

    if (!selectedRole) {
      throw new Error("Requested role is not assigned to this account.");
    }
  } else {
    selectedRole = selectDefaultRole(roles);
  }

  if (!selectedRole) {
    throw new Error("Unable to determine an active role for this account.");
  }

  // ----------------------------------------------------------
  // Prepare safe authenticated user response.
  // ----------------------------------------------------------

  const safeUser = toLoginUserResponse(user, roles);

  return {
    success: true,
    message: "Login successful.",
    user: safeUser,
    currentRole: selectedRole,
  };
}

// ============================================================
// CURRENT USER
// ============================================================

/**
 * Resolve the currently authenticated user again from DB.
 *
 * This is intentionally database-backed so that:
 * - account disable/suspension takes effect
 * - role changes are reflected
 * - stale frontend user data is never authoritative
 */
export async function getCurrentUser(
  userId: number,
): Promise<CurrentUserResult> {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid authenticated user ID.");
  }

  const user = await getAuthenticatedUserById(userId);

  if (!user) {
    throw new Error("Authenticated user account was not found.");
  }

  if (!Boolean(user.is_activated)) {
    throw new Error("Your account is not activated.");
  }

  if (String(user.status).toLowerCase() !== "active") {
    throw new Error("Your account is not active.");
  }

  const roles = await getActiveUserRoles(userId);

  if (!roles.length) {
    throw new Error("No active role is assigned to this account.");
  }

  return {
    user: toLoginUserResponse(user, roles),
  };
}
