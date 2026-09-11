import type { Request, Response } from "express";

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

import {
  createUserSession,
  revokeUserSession,
} from "../services/session.service";

// ============================================================
// AUTH CONTROLLER
// ============================================================
//
// Responsibilities:
// - Receive HTTP request
// - Call auth/session services
// - Call email service where required
// - Establish/revoke authenticated browser session
// - Return safe API responses
//
// NOT responsible for:
// - SQL
// - Password hashing / verification
// - Role assignment
// - Frontend/localStorage
// - JWT creation
//
// Security principle:
// Backend + Database are the source of truth.
// Authentication uses an opaque, database-backed session cookie.
// ============================================================

const AUTH_COOKIE_NAME = "wii_auth_token";

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
// The cookie contains only an opaque random session token.
//
// Frontend JavaScript:
// - cannot read the token because it is HttpOnly
// - never receives session metadata
// - never stores authentication credentials in localStorage
//
// No maxAge/expires is set intentionally: this is a browser session
// cookie. Server-side absolute and idle limits remain authoritative.
// ============================================================

function setAuthCookie(res: Response, sessionToken: string): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

function clearAuthCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

function getAuthCookie(req: Request): string | null {
  const cookieHeader = String(req.headers.cookie || "");

  if (!cookieHeader) {
    return null;
  }

  for (const rawCookie of cookieHeader.split(";")) {
    const separatorIndex = rawCookie.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = rawCookie.slice(0, separatorIndex).trim();

    if (cookieName !== AUTH_COOKIE_NAME) {
      continue;
    }

    const rawValue = rawCookie.slice(separatorIndex + 1).trim();

    if (!rawValue) {
      return null;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return null;
    }
  }

  return null;
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

    try {
      await sendRegistrationActivationEmail({
        fullName: String(req.body?.fullName || "").trim(),
        email: result.email,
        activationToken: result.activationToken,
      });
    } catch (emailError) {
      console.error("REGISTRATION ACTIVATION EMAIL ERROR:", emailError);

      return res.status(503).json({
        success: false,
        message:
          "Your account was created, but the activation email could not be sent. Please contact the administrator.",
      });
    }

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
// Secure opaque session generated server-side
//        ↓
// SHA-256 hash stored in DB
//        ↓
// HttpOnly browser session cookie
//        ↓
// Safe user response
//
// No JWT is created or returned.
// ============================================================

export async function loginAuth(req: Request, res: Response) {
  try {
    const result = await login({
      email: req.body?.email,
      password: req.body?.password,
      requestedRole: req.body?.requestedRole,
    });

    // --------------------------------------------------------
    // Create the server-side session only after credentials,
    // account state and database roles have been validated.
    // --------------------------------------------------------

    const session = await createUserSession({
      userId: result.user.id,
      ipAddress: req.ip || null,
      userAgent: req.get("user-agent") || null,
    });

    setAuthCookie(res, session.sessionToken);

    // --------------------------------------------------------
    // SECURITY:
    // Raw token and session metadata are never included in the
    // response body.
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
// authenticateToken middleware has already validated the
// server-side session and current account state.
// ============================================================

export async function meAuth(req: Request, res: Response) {
  try {
    const userId = Number((req as any).user?.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      clearAuthCookie(res);

      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const result = await getCurrentUser(userId);

    if (!result?.user) {
      clearAuthCookie(res);

      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    return res.status(200).json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error("GET /api/me ERROR:", error);

    // Do not clear a valid browser session merely because the
    // database/service had a transient failure.
    return res.status(500).json({
      success: false,
      message: "Unable to verify authentication.",
    });
  }
}

// ============================================================
// POST /api/logout
// ============================================================
//
// Logout revokes the server-side session first, then clears the
// browser cookie. If the session is already gone, the endpoint
// remains idempotently successful.
// ============================================================

export async function logoutAuth(req: Request, res: Response) {
  try {
    const sessionToken = getAuthCookie(req);

    if (sessionToken) {
      await revokeUserSession(sessionToken, "logout");
    }

    clearAuthCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("POST /api/logout ERROR:", error);

    // The browser cookie is still cleared so the client does not
    // continue presenting a possibly unusable credential.
    clearAuthCookie(res);

    return res.status(500).json({
      success: false,
      message: "Unable to complete logout.",
    });
  }
}
