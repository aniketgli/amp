import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import {
  activate,
  getCurrentUser,
  login,
  register,
} from "../services/auth.service";

import {
  sendActivationSuccessEmail,
  sendRegistrationActivationEmail,
} from "../services/email.service";

import { JWT_SECRET } from "../config/env";

// ============================================================
// AUTH CONTROLLER
// ============================================================
//
// Responsibilities:
// - Receive HTTP request
// - Call auth service
// - Call email service where required
// - Establish authenticated browser session
// - Return safe API responses
//
// NOT responsible for:
// - SQL
// - Password hashing / verification
// - Role assignment
// - Frontend/localStorage
//
// Security principle:
// Backend + Database are the source of truth.
// Frontend role/session state is never trusted.
// ============================================================

const AUTH_COOKIE_NAME = "wii_auth_token";

const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to process the request.";
}

// ============================================================
// ERROR STATUS HELPERS
// ============================================================

function getRegisterErrorStatus(message: string): number {
  const normalized = message.toLowerCase();

  if (normalized.includes("already exists")) {
    return 409;
  }

  if (
    normalized.includes("required") ||
    normalized.includes("valid") ||
    normalized.includes("must") ||
    normalized.includes("password") ||
    normalized.includes("phone") ||
    normalized.includes("email")
  ) {
    return 400;
  }

  return 500;
}

function getLoginErrorStatus(message: string): number {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid email or password")) {
    return 401;
  }

  if (
    normalized.includes("not activated") ||
    normalized.includes("not active")
  ) {
    return 403;
  }

  if (
    normalized.includes("no active role") ||
    normalized.includes("role") ||
    normalized.includes("assigned")
  ) {
    return 403;
  }

  if (
    normalized.includes("required") ||
    normalized.includes("too long") ||
    normalized.includes("valid")
  ) {
    return 400;
  }

  return 500;
}

// ============================================================
// AUTH COOKIE
// ============================================================
//
// JWT is stored only in an HttpOnly cookie.
//
// Frontend JavaScript:
// - cannot read the token
// - cannot modify the token
// - cannot use localStorage as the authentication source
//
// Browser automatically sends the cookie with same-origin requests.
// ============================================================

function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
}

function clearAuthCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// ============================================================
// POST /api/register
// ============================================================
//
// IMPORTANT:
// Frontend does NOT send a role.
// Backend auth service assigns the default "user" role.
// ============================================================

export async function registerAuth(req: Request, res: Response) {
  try {
    const result = await register({
      fullName: req.body?.fullName,
      email: req.body?.email,
      phone: req.body?.phone,
      password: req.body?.password,
    });

    if (!result.success) {
      const message = result.message || "Registration failed.";
      const status = getRegisterErrorStatus(message);

      return res.status(status).json({
        success: false,
        message,
      });
    }

    // --------------------------------------------------------
    // Registration must produce activation information.
    // --------------------------------------------------------

    if (!result.userId || !result.email || !result.activationToken) {
      console.error(
        "Registration succeeded but activation data is incomplete.",
      );

      return res.status(500).json({
        success: false,
        message:
          "Registration could not be completed because activation details were not generated.",
      });
    }

    // --------------------------------------------------------
    // Send activation email only after successful DB creation.
    // --------------------------------------------------------

    try {
      await sendRegistrationActivationEmail({
        fullName: String(req.body?.fullName || "").trim(),
        email: result.email,
        activationToken: result.activationToken,
      });
    } catch (emailError) {
      console.error("REGISTRATION ACTIVATION EMAIL ERROR:", emailError);

      // Account exists, but user cannot activate without the link.
      // Do NOT expose the activation token in the API response.
      return res.status(503).json({
        success: false,
        message:
          "Your account was created, but the activation email could not be sent. Please contact the administrator.",
      });
    }

    // --------------------------------------------------------
    // SECURITY:
    // Never return activationToken to frontend.
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email for the account activation link.",
      userId: result.userId,
      email: result.email,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("POST /api/register ERROR:", error);

    const status = getRegisterErrorStatus(message);

    return res.status(status).json({
      success: false,
      message: status === 500 ? "Unable to complete registration." : message,
    });
  }
}

// ============================================================
// GET /api/activate/:token
// ============================================================
//
// Activation is performed completely by the backend.
//
// Frontend only displays the result.
// ============================================================

export async function activateAuth(req: Request, res: Response) {
  try {
    const token = String(req.params.token || "").trim();

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Activation token is required.",
      });
    }

    const result = await activate(token);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || "Invalid or expired activation link.",
      });
    }

    // --------------------------------------------------------
    // Activation has already succeeded in the database.
    //
    // This email is informational only.
    // Email failure must NOT undo successful activation.
    // --------------------------------------------------------

    // Activation is already committed in the database.
    // Do not block the HTTP response on the informational email.
    // A slow/unavailable SMTP server must not leave the activation
    // page stuck while the account is already active.
    if (result.user) {
      void sendActivationSuccessEmail({
        fullName: result.user.fullName,
        email: result.user.email,
      }).catch((emailError) => {
        console.warn("ACTIVATION SUCCESS EMAIL ERROR:", emailError);
      });
    }

    return res.status(200).json({
      success: true,
      alreadyActivated: Boolean(result.alreadyActivated),
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("GET /api/activate/:token ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to activate the account.",
    });
  }
}

// ============================================================
// POST /api/login
// ============================================================
//
// Login flow:
//
// Frontend credentials
//        ↓
// Auth Service
//        ↓
// Database user/password/status/role validation
//        ↓
// JWT generated server-side
//        ↓
// HttpOnly cookie
//        ↓
// Safe user response
//
// JWT is NEVER returned to JavaScript.
// ============================================================

export async function loginAuth(req: Request, res: Response) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured correctly.",
      });
    }

    const result = await login({
      email: req.body?.email,
      password: req.body?.password,

      // This may be used for UI/workflow selection,
      // but the auth service must validate the requested
      // role against the database.
      requestedRole: req.body?.requestedRole,
    });

    // --------------------------------------------------------
    // JWT is generated only on the backend.
    // --------------------------------------------------------

    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        role: result.currentRole.code,
        roleId: result.currentRole.id,
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
        algorithm: "HS256",
      },
    );

    // --------------------------------------------------------
    // Store JWT in HttpOnly cookie.
    // --------------------------------------------------------

    setAuthCookie(res, token);

    // --------------------------------------------------------
    // SECURITY:
    // JWT/token is intentionally NOT included in response.
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      currentRole: result.currentRole,
      user: result.user,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("POST /api/login ERROR:", error);

    const status = getLoginErrorStatus(message);

    return res.status(status).json({
      success: false,
      message: status === 500 ? "Unable to process login request." : message,
    });
  }
}

// ============================================================
// GET /api/me
// ============================================================
//
// authenticateToken middleware verifies the JWT.
//
// IMPORTANT:
// The user is then loaded again from the DATABASE.
//
// Therefore:
// - deleted user → rejected
// - deactivated user → rejected
// - changed roles → DB value is used
// - stale frontend state → irrelevant
// ============================================================

export async function meAuth(req: Request, res: Response) {
  try {
    const userId = Number((req as any).user?.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      clearAuthCookie(res);

      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    const result = await getCurrentUser(userId);

    if (!result?.user) {
      clearAuthCookie(res);

      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("GET /api/me ERROR:", error);

    const normalized = message.toLowerCase();

    if (
      normalized.includes("not found") ||
      normalized.includes("not activated") ||
      normalized.includes("not active") ||
      normalized.includes("role")
    ) {
      clearAuthCookie(res);

      return res.status(403).json({
        success: false,
        message,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Unable to verify the authenticated session.",
    });
  }
}

// ============================================================
// POST /api/logout
// ============================================================
//
// Logout is server-side cookie invalidation.
// Frontend does not need access to the JWT.
// ============================================================

export function logoutAuth(_req: Request, res: Response) {
  clearAuthCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}
