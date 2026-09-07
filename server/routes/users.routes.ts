import type { Express } from "express";

import { db, isDbConnected } from "../db/connection";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";
import { ADMIN_ROLES } from "../config/constants";

export function registerUsersRoutes(app: Express) {

  // GET /api/me
  app.get("/api/me", authenticateToken, async (req: any, res) => {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database is unavailable.",
      });
    }

    const userId = req.user.userId;

    const [users]: any = await db.query(
      `SELECT id, employee_id, full_name, email, phone, intercom_extension, is_activated, status, last_active_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );

    if (!users || users.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "User account no longer exists." });
    }

    const user = users[0];

    if (
      Number(user.is_activated) !== 1 ||
      String(user.status).toLowerCase() !== "active"
    ) {
      return res
        .status(401)
        .json({ success: false, message: "User account is inactive." });
    }

    const roles = await getUserRoles(userId);

    return res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        intercomExtension: user.intercom_extension,
        isActivated: Boolean(user.is_activated),
        status: user.status,
        lastActiveAt: user.last_active_at,
        roles,
      },
    });
  } catch (error) {
    console.error("GET /api/me ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch user information.",
    });
  }
})

  // GET /api/users
  app.get(
  "/api/users",
  authenticateToken,
  requireRole(...ADMIN_ROLES),
  async (req, res) => {
    try {
      if (!isDbConnected) {
        return res
          .status(503)
          .json({ success: false, message: "Database is unavailable." });
      }

      const [users]: any = await db.query(`
      SELECT u.id, u.employee_id, u.full_name, u.email, u.phone,
             u.intercom_extension, u.status, u.is_activated, u.created_at,
             GROUP_CONCAT(
               DISTINCT JSON_OBJECT('id', r.id, 'code', r.role_code, 'name', r.role_name)
               ORDER BY r.id SEPARATOR '|||'
             ) AS role_data
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = 1
      GROUP BY u.id, u.employee_id, u.full_name, u.email, u.phone,
               u.intercom_extension, u.status, u.is_activated, u.created_at
      ORDER BY u.id ASC
    `);

      const formattedUsers = users.map((user: any) => {
        const roles = user.role_data
          ? user.role_data
              .split("|||")
              .map((item: string) => {
                try {
                  return JSON.parse(item);
                } catch {
                  return null;
                }
              })
              .filter(Boolean)
          : [];

        return {
          id: user.id,
          employeeId: user.employee_id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          intercomExtension: user.intercom_extension,
          status: user.status,
          isActivated: Boolean(user.is_activated),
          roles,
        };
      });

      return res.json({
        success: true,
        count: formattedUsers.length,
        users: formattedUsers,
      });
    } catch (error) {
      console.error("GET USERS ERROR:", error);
      return res
        .status(500)
        .json({ success: false, message: "Unable to fetch users." });
    }
  },
)

  // PUT /api/users/:userId/roles
  app.put(
  "/api/users/:userId/roles",
  authenticateToken,
  requireRole(...ADMIN_ROLES),
  async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const { roleIds } = req.body;

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one role must be assigned.",
        });
      }

      const cleanRoleIds = [
        ...new Set(roleIds.map(Number).filter((id) => Number.isInteger(id))),
      ];

      if (isDbConnected) {
        let connection: any = null;
        try {
          connection = await db.getConnection();

          const [users]: any = await db.query(
            "SELECT id FROM users WHERE id = ? LIMIT 1",
            [userId],
          );

          if (users.length > 0) {
            const placeholders = cleanRoleIds.map(() => "?").join(",");
            const [roles]: any = await db.query(
              `SELECT id FROM roles WHERE id IN (${placeholders}) AND is_active = 1`,
              cleanRoleIds,
            );

            if (roles.length === cleanRoleIds.length) {
              await connection.beginTransaction();
              await connection.query(
                "DELETE FROM user_roles WHERE user_id = ?",
                [userId],
              );
              for (const roleId of cleanRoleIds) {
                await connection.query(
                  `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`,
                  [userId, roleId],
                );
              }
              await connection.commit();

              return res.json({
                success: true,
                message: "User roles updated successfully.",
                userId,
                roleIds: cleanRoleIds,
              });
            }
          }
        } catch (dbErr) {
          if (connection) await connection.rollback().catch(() => {});
        } finally {
          if (connection) connection.release();
        }
      }

      return res.status(404).json({
        success: false,
        message: "User or active roles not found.",
      });

      return res.json({
        success: true,
        message: "User roles updated successfully.",
        userId,
        roleIds: cleanRoleIds,
      });
    } catch (error: any) {
      console.error("UPDATE USER ROLES ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to update user roles.",
      });
    }
  },
)
}
