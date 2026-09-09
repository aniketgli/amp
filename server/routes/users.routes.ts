import type { Express } from "express";

import { isDbConnected } from "../db/connection";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";
import { ADMIN_ROLES } from "../config/constants";
import {
  getUserById,
  getAllUsers,
  getUserRoles,
  updateUserRoles,
} from "../repositories/user.repository";

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

    const userId = Number(req.user.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID is invalid.",
      });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User account no longer exists." });
    }

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

      const users = await getAllUsers();

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
        try {
          const updated = await updateUserRoles(userId, cleanRoleIds);

          if (updated) {
            return res.json({
              success: true,
              message: "User roles updated successfully.",
              userId,
              roleIds: cleanRoleIds,
            });
          }
        } catch (dbErr) {
          console.warn(
            "MySQL PUT /api/users/:userId/roles error.",
          );
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


