import type { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import { db, isDbConnected } from "../db/connection";

import {
  PORT,
  JWT_SECRET,
  EMAIL_USER,
  EMAIL_PASS,
} from "../config/env";

async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!password || !storedHash) return false;

  try {
    return await bcrypt.compare(password, storedHash);
  } catch (error) {
    console.error("Password verification failed:", error);
    return false;
  }
}

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export function registerAuthRoutes(app: Express) {

  // POST /api/register
  app.post("/api/register", async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message:
          "Registration is temporarily unavailable because the database is offline.",
      });
    }

    const { fullName, email, phone, password } = req.body;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields are required.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 128 characters.",
      });
    }

    const cleanName = String(fullName).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();

    // -----------------------------------------------------
    // CHECK EXISTING USER
    // -----------------------------------------------------

    let existingInDb = false;

    if (isDbConnected) {
      try {
        const [existingUsers]: any = await db.query(
          "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
          [cleanEmail],
        );

        if (existingUsers.length > 0) {
          existingInDb = true;
        }
      } catch (error) {
        console.error("Unable to check existing DB user:", error);
        return res.status(503).json({
          success: false,
          message: "Unable to verify account availability right now.",
        });
      }
    }

    if (existingInDb) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // -----------------------------------------------------
    // PASSWORD + ACTIVATION TOKEN
    // -----------------------------------------------------

    const passwordHash = await bcrypt.hash(password, 12);

    const activationToken = crypto.randomUUID();

    // -----------------------------------------------------
    // CREATE USER
    // -----------------------------------------------------

    let userId: number;

    if (isDbConnected) {
      try {
        // -------------------------------------------------
        // STEP 1: INSERT USER
        // -------------------------------------------------

        const [result]: any = await db.query(
          `INSERT INTO users
          (
            employee_id,
            full_name,
            email,
            phone,
            password_hash,
            is_activated,
            activation_token,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            null,
            cleanName,
            cleanEmail,
            cleanPhone,
            passwordHash,
            0,
            activationToken,
            "inactive",
          ],
        );

        userId = result.insertId;

        // -------------------------------------------------
        // STEP 2: ASSIGN DEFAULT "USER" ROLE
        // roles.id = 1
        // -------------------------------------------------

        await db.query(
          `INSERT INTO user_roles
          (user_id, role_id)
          VALUES (?, ?)`,
          [userId, 1],
        );

        console.log(`Default "user" role assigned to user ID: ${userId}`);
      } catch (err) {
        console.error("DB registration error:", err);

        return res.status(500).json({
          success: false,
          message: "Unable to create user account.",
          error: undefined,
        });
      }
    }

    // -----------------------------------------------------
    // ACTIVATION LINK
    // -----------------------------------------------------

    const clientHost = process.env.CLIENT_URL || `http://localhost:${PORT}`;

    const activationLink = `${clientHost}/activate/${activationToken}`;

    // -----------------------------------------------------
    // SEND ACTIVATION EMAIL
    // -----------------------------------------------------

    if (EMAIL_USER && EMAIL_PASS) {
      try {
        await mailTransporter.sendMail({
          from: `"Wildlife Institute of India" <${EMAIL_USER}>`,
          to: cleanEmail,
          subject: "Activate Your WII Access Management Portal Account",

          text: `Dear ${cleanName},

Welcome to the Wildlife Institute of India Access Management Portal.

Your account has been successfully registered.

Please activate your account using the following link:

${activationLink}

After activation, you can log in using your registered email address and password.

Regards,
Wildlife Institute of India
`,

          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">

              <h2>Welcome to WII Access Management Portal</h2>

              <p>Dear <strong>${cleanName}</strong>,</p>

              <p>
                Your account has been successfully registered
                with the Wildlife Institute of India Access Management Portal.
              </p>

              <p>
                Please click the button below to activate your account:
              </p>

              <p>
                <a
                  href="${activationLink}"
                  style="
                    display:inline-block;
                    padding:12px 20px;
                    background:#008f63;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;
                  "
                >
                  Activate My Account
                </a>
              </p>

              <p>
                If the button does not work, copy and open this link:
              </p>

              <p>${activationLink}</p>

              <p>
                After activation, you can log in using your
                registered email address and password.
              </p>

              <br>

              <p>
                Regards,<br>
                <strong>Wildlife Institute of India</strong>
              </p>

            </div>
          `,
        });

        console.log(`Activation email sent successfully to ${cleanEmail}`);
      } catch (error) {
        console.warn("SMTP email notification failed.", error);

        console.warn("Activation email could not be sent.");
      }
    }

    // -----------------------------------------------------
    // SUCCESS RESPONSE
    // -----------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Registration successful. Activation email has been sent.",

      userId,

      email: cleanEmail,

      // Default role assigned during registration
      role: {
        id: 1,
        code: "user",
        name: "User",
      },
    });
  } catch (error: any) {
    console.error("REGISTRATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete registration.",
      error: undefined,
    });
  }
})

  // GET /api/activate/:token
  app.get("/api/activate/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Activation token is required.",
      });
    }

    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message:
          "Account activation is temporarily unavailable because the database is offline.",
      });
    }

    const cleanToken = token.trim();

    const [users]: any = await db.query(
      `SELECT id, employee_id, full_name, email, is_activated
       FROM users
       WHERE activation_token = ?
       LIMIT 1`,
      [cleanToken],
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired activation token.",
      });
    }

    const activeUser = users[0];

    await db.query(
      `UPDATE users
       SET is_activated = 1, status = 'active', activation_token = NULL, updated_at = NOW()
       WHERE id = ?`,
      [activeUser.id],
    );

    return res.status(200).json({
      success: true,
      alreadyActivated: Boolean(activeUser.is_activated),
      message: "Account activated successfully. You can now login.",
      user: {
        id: activeUser.id,
        employee_id: activeUser.employee_id,
        full_name: activeUser.full_name,
        email: activeUser.email,
      },
    });
  } catch (error: any) {
    console.error("ACTIVATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to activate account.",
    });
  }
})

  // POST /api/login
  app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message:
          "Login is temporarily unavailable because the database is offline.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const [users]: any = await db.query(
      `SELECT
         id, employee_id, full_name, email, phone, password_hash,
         is_activated, intercom_extension, status
       FROM users
       WHERE LOWER(email) = ? OR LOWER(employee_id) = ?
       LIMIT 1`,
      [cleanEmail, cleanEmail],
    );

    if (!users || users.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const user = users[0];

    if (
      Number(user.is_activated) !== 1 ||
      String(user.status).toLowerCase() !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is not activated. Please activate your account first.",
      });
    }

    const passwordMatch = await verifyPassword(password, user.password_hash);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const [roleRows]: any = await db.query(
      `SELECT r.id, r.role_code, r.role_name
       FROM user_roles ur
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ? AND r.is_active = 1
       ORDER BY r.id`,
      [user.id],
    );

    const roles = (roleRows || []).map((role: any) => ({
      id: role.id,
      code: String(role.role_code || "").trim(),
      name: role.role_name,
    }));

    if (roles.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No active role is assigned to this account.",
      });
    }

    const bodyRequestedRole = String(
      req.body?.requestedRole || "",
    ).trim().toLowerCase();

    const roleCodeMap: Record<string, string> = {
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

    const requestedWorkflowRole =
      bodyRequestedRole
        ? roleCodeMap[bodyRequestedRole]
        : undefined;

    const userRole =
      requestedWorkflowRole
        ? roles.find(
            (role: any) =>
              roleCodeMap[
                String(role.code || "")
                  .trim()
                  .toLowerCase()
              ] === requestedWorkflowRole,
          )
        : roles.find(
            (role: any) => {
              const normalizedCode =
                String(role.code || "")
                  .trim()
                  .toLowerCase();

              return (
                normalizedCode === "user" ||
                normalizedCode === "applicant"
              );
            },
          );

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: requestedWorkflowRole
          ? "Requested role is not assigned to this account."
          : "Account is missing the required User role. Please contact an administrator.",
      });
    }

    const workflowRole =
      roleCodeMap[
        String(userRole.code || "")
          .trim()
          .toLowerCase()
      ];

    if (!workflowRole) {
      return res.status(403).json({
        success: false,
        message:
          "Assigned role is not supported by the application.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: workflowRole,
        roleId: userRole.id,
      },
      JWT_SECRET,
      { expiresIn: "24h", algorithm: "HS256" },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      currentRole: userRole,
      user: {
        id: user.id,
        employeeId: user.employee_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        intercomExtension: user.intercom_extension,
        status: user.status,
        isActivated: Boolean(user.is_activated),
        roles,
      },
    });
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process login request.",
    });
  }
})
}


