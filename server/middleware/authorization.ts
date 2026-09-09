import { db } from "../db/connection";

/**
 * Fetch all active roles assigned to a user.
 *
 * Roles are always read from MySQL.
 * No hardcoded role assignment is performed here.
 */
export async function getUserRoles(userId: number | string): Promise<string[]> {
  const [rows]: any = await db.query(
    `SELECT r.role_code
     FROM user_roles ur
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ? AND r.is_active = 1`,
    [userId],
  );

  return (rows || [])
    .map((row: any) =>
      String(row.role_code || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}

/**
 * Role-based authorization middleware.
 *
 * Usage:
 *
 * requireRole("administrator")
 *
 * or:
 *
 * requireRole(
 *   "administrator",
 *   "admin",
 *   "system_administrator",
 * )
 */
export function requireRole(...allowedRoles: string[]) {
  const allowed = new Set(allowedRoles.map((role) => role.toLowerCase()));

  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authenticated user could not be identified.",
        });
      }

      const roles = await getUserRoles(userId);

      if (!roles.some((role) => allowed.has(role))) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      req.userRoles = roles;

      next();
    } catch (error) {
      console.error("AUTHORIZATION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to verify authorization.",
      });
    }
  };
}
