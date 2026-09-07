import jwt from "jsonwebtoken";

/**
 * JWT Authentication Middleware
 *
 * Purpose:
 * - Authorization header se Bearer token read karta hai.
 * - JWT ko HS256 algorithm ke saath verify karta hai.
 * - Valid token ka decoded payload req.user me attach karta hai.
 * - Invalid / missing token par 401 return karta hai.
 */

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required.");
}

export function authenticateToken(req: any, res: any, next: any) {
  try {
    const authHeader = String(req.headers.authorization || "");

    const match = authHeader.match(/^Bearer\s+([^\s]+)$/);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    const decoded = jwt.verify(match[1], JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (typeof decoded !== "object" || !decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
}
