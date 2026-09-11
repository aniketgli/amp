import type { NextFunction, Request, Response } from "express";

import {
  getAuthenticatedUserById,
  getActiveUserRoles,
} from "../repositories/auth.repository";
import { validateSession } from "../services/session.service";

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================
//
// Browser
//   ↓
// HttpOnly session cookie
//   ↓
// SHA-256 lookup in server-side session store
//   ↓
// Session revocation / absolute expiry / invisible idle validation
//   ↓
// Database user verification
//   ↓
// Current database role resolution
//   ↓
// Trusted req.user identity
//
// IMPORTANT:
// - Database is authoritative for session and account state.
// - Browser never receives a JWT or session metadata.
// - Authorization continues to resolve permissions from the DB.
// - Bearer/JWT authentication is intentionally not accepted here.
// ============================================================

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

const AUTH_COOKIE_NAME = "wii_auth_token";

// ============================================================
// COOKIE PARSER
// ============================================================

function getCookie(req: Request, name: string): string | null {
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

    if (cookieName !== name) {
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
// AUTHENTICATE SERVER SESSION
// ============================================================

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> {
  try {
    // ----------------------------------------------------------
    // 1. Read the opaque HttpOnly session cookie.
    // ----------------------------------------------------------

    const sessionToken = getCookie(req, AUTH_COOKIE_NAME);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    // ----------------------------------------------------------
    // 2. Validate against the server-side session store.
    // ----------------------------------------------------------

    const authenticatedSession = await validateSession(sessionToken);

    if (!authenticatedSession) {
      // Remove an unusable cookie. Session details remain server-side.
      res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return res.status(401).json({
        success: false,
        message: "Your session has ended. Please log in again.",
      });
    }

    const userId = authenticatedSession.userId;

    // ----------------------------------------------------------
    // 3. Re-check the current user from MySQL.
    // ----------------------------------------------------------

    const currentUser = await getAuthenticatedUserById(userId);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    // ----------------------------------------------------------
    // 4. Resolve CURRENT role directly from MySQL.
    // ----------------------------------------------------------

    const activeRoles = await getActiveUserRoles(userId);

    if (!activeRoles.length) {
      return res.status(403).json({
        success: false,
        message:
          "No active role is assigned to this account. Please contact the administrator.",
      });
    }

    const databaseRole =
      activeRoles.find(
        (role) =>
          String(role.code || "")
            .trim()
            .toLowerCase() === "user",
      ) || activeRoles[0];

    const currentRole = String(databaseRole.code || "")
      .trim()
      .toLowerCase();

    if (!currentRole) {
      return res.status(403).json({
        success: false,
        message: "Unable to determine the active role for this account.",
      });
    }

    // ----------------------------------------------------------
    // 5. DB is authoritative for activation state.
    // ----------------------------------------------------------

    if (!currentUser.is_activated) {
      return res.status(403).json({
        success: false,
        message: "Your account is not activated.",
      });
    }

    // ----------------------------------------------------------
    // 6. DB is authoritative for account status.
    // ----------------------------------------------------------

    if (String(currentUser.status).toLowerCase() !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    // ----------------------------------------------------------
    // 7. Attach only trusted server/database identity.
    // ----------------------------------------------------------

    (req as AuthenticatedRequest).user = {
      userId,
      email: currentUser.email,
      role: currentRole,
    };

    return next();
  } catch (error) {
    // ----------------------------------------------------------
    // Unexpected server/database failure.
    //
    // A temporary backend failure is NOT an authentication failure.
    // Return 500 so the frontend can avoid logging the user out merely
    // because the server/database is temporarily unavailable.
    // ----------------------------------------------------------

    console.error("AUTHENTICATION MIDDLEWARE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify authentication.",
    });
  }
}
