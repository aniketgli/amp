import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { JWT_SECRET } from "../config/env";
import { getAuthenticatedUserById } from "../repositories/auth.repository";

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================
//
// Authentication flow:
//
// Browser
//   ↓
// HttpOnly cookie
//   ↓
// JWT signature/expiry verification
//   ↓
// Database user verification
//   ↓
// Trusted req.user identity
//
// IMPORTANT:
// - Database is authoritative for account state.
// - JWT roles are NOT trusted.
// - Authorization middleware must resolve current roles
//   from the database.
// ============================================================

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

const AUTH_COOKIE_NAME = "wii_auth_token";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required.");
}

// ============================================================
// COOKIE PARSER
// ============================================================

function getCookie(req: Request, name: string): string | null {
  const cookieHeader = String(req.headers.cookie || "");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const rawCookie of cookies) {
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
      // Malformed cookie value.
      return null;
    }
  }

  return null;
}

// ============================================================
// TOKEN EXTRACTION
// ============================================================
//
// Preferred:
//   HttpOnly cookie
//
// Temporary compatibility:
//   Authorization: Bearer <token>
//
// The frontend must not persist the JWT itself.
// ============================================================

function getAuthToken(req: Request): string | null {
  const cookieToken = getCookie(req, AUTH_COOKIE_NAME);

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = String(req.headers.authorization || "");

  const match = authHeader.match(/^Bearer\s+([^\s]+)$/);

  return match?.[1] || null;
}

// ============================================================
// JWT PAYLOAD VALIDATION
// ============================================================

interface AuthTokenPayload extends JwtPayload {
  userId: number;
}

function isValidTokenPayload(
  payload: string | JwtPayload,
): payload is AuthTokenPayload {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const userId = Number(
    (
      payload as JwtPayload & {
        userId?: unknown;
      }
    ).userId,
  );

  return Number.isInteger(userId) && userId > 0;
}

// ============================================================
// AUTHENTICATE TOKEN
// ============================================================

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> {
  try {
    // ----------------------------------------------------------
    // 1. Get token.
    // ----------------------------------------------------------

    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    // ----------------------------------------------------------
    // 2. Verify JWT.
    //
    // Only HS256 is accepted.
    // Signature + expiry are checked by jsonwebtoken.
    // ----------------------------------------------------------

    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!isValidTokenPayload(decoded)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const userId = Number(decoded.userId);

    // ----------------------------------------------------------
    // 3. Re-check user from MySQL.
    //
    // A valid JWT alone is NOT sufficient.
    // ----------------------------------------------------------

    const currentUser = await getAuthenticatedUserById(userId);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user account could not be found.",
      });
    }

    // ----------------------------------------------------------
    // 4. DB is authoritative for activation state.
    // ----------------------------------------------------------

    if (!currentUser.is_activated) {
      return res.status(403).json({
        success: false,
        message: "Your account is not activated.",
      });
    }

    // ----------------------------------------------------------
    // 5. DB is authoritative for account status.
    // ----------------------------------------------------------

    if (String(currentUser.status).toLowerCase() !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    // ----------------------------------------------------------
    // 6. Attach only trusted identity.
    //
    // NEVER attach role information from JWT.
    // Authorization middleware resolves roles from DB.
    // ----------------------------------------------------------

    (req as AuthenticatedRequest).user = {
      userId,
      email: currentUser.email,
    };

    return next();
  } catch (error) {
    // ----------------------------------------------------------
    // Expired JWT.
    // ----------------------------------------------------------

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message:
          "Your authentication session has expired. Please log in again.",
      });
    }

    // ----------------------------------------------------------
    // Invalid/malformed JWT.
    // ----------------------------------------------------------

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ----------------------------------------------------------
    // Unexpected server/database error.
    // ----------------------------------------------------------

    console.error("AUTHENTICATION MIDDLEWARE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify authentication.",
    });
  }
}
