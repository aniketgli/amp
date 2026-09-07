import { db } from "../db/connection";

// ------------------------------------------------------------
// User Repository
// ------------------------------------------------------------
// Database-only operations for users and their roles.
// Route-level authentication / authorization remains in
// server/routes/users.routes.ts.
// ------------------------------------------------------------

export async function getUserById(userId: number) {
  const [users]: any = await db.query(
    `SELECT
       id,
       employee_id,
       full_name,
       email,
       phone,
       intercom_extension,
       is_activated,
       status,
       last_active_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId],
  );

  return users?.[0] || null;
}

export async function getAllUsers() {
  const [users]: any = await db.query(`
    SELECT
      u.id,
      u.employee_id,
      u.full_name,
      u.email,
      u.phone,
      u.intercom_extension,
      u.status,
      u.is_activated,
      u.created_at,
      GROUP_CONCAT(
        DISTINCT JSON_OBJECT(
          'id', r.id,
          'code', r.role_code,
          'name', r.role_name
        )
        ORDER BY r.id
        SEPARATOR '|||'
      ) AS role_data
    FROM users u
    LEFT JOIN user_roles ur
      ON ur.user_id = u.id
    LEFT JOIN roles r
      ON r.id = ur.role_id
      AND r.is_active = 1
    GROUP BY
      u.id,
      u.employee_id,
      u.full_name,
      u.email,
      u.phone,
      u.intercom_extension,
      u.status,
      u.is_activated,
      u.created_at
    ORDER BY u.id ASC
  `);

  return users || [];
}

export async function updateUserRoles(
  userId: number,
  roleIds: number[],
): Promise<boolean> {
  const connection = await db.getConnection();

  try {
    // Verify user exists.
    const [users]: any = await db.query(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    if (!users || users.length === 0) {
      return false;
    }

    // Verify all supplied roles exist and are active.
    const placeholders = roleIds.map(() => "?").join(",");

    const [roles]: any = await db.query(
      `SELECT id
       FROM roles
       WHERE id IN (${placeholders})
         AND is_active = 1`,
      roleIds,
    );

    if (!roles || roles.length !== roleIds.length) {
      return false;
    }

    await connection.beginTransaction();

    await connection.query(
      "DELETE FROM user_roles WHERE user_id = ?",
      [userId],
    );

    for (const roleId of roleIds) {
      await connection.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
        [userId, roleId],
      );
    }

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}
