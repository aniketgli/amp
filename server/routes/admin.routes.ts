import nodemailer from "nodemailer";
import type { Express } from "express";

import { db, isDbConnected } from "../db/connection";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";
import { ADMIN_ROLES } from "../config/constants";


const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export function registerAdminRoutes(app: Express) {

  app.get(
    ["/api/db-test", "/api/db/test"],
    authenticateToken,
    requireRole(...ADMIN_ROLES),
    async (req, res) => {
      try {
        const [rows] = await db.query(
          "SELECT 1 AS connected, DATABASE() AS database_name",
        );
        res.json({
          success: true,
          message: "Database connected successfully.",
          data: rows,
        });
      } catch (error: any) {
        res.status(200).json({
          success: false,
          message: "MySQL Database is unavailable.",
          error: undefined,
        });
      }
    },
  )
  
  app.get(
    "/api/email-test",
    authenticateToken,
    requireRole(...ADMIN_ROLES),
    async (req, res) => {
      try {
        await mailTransporter.verify();
        return res.json({
          success: true,
          message: "Email SMTP connection successful.",
          emailConfigured: Boolean(EMAIL_USER && EMAIL_PASS),
        });
      } catch (error: any) {
        return res.status(200).json({
          success: false,
          message: "Email SMTP not configured or unavailable.",
          error: undefined,
        });
      }
    },
  )


  // GET /api/branding
  app.get("/api/branding", async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: "Branding database is unavailable.",
      });
    }

    const [rows]: any = await db.query(`
      SELECT
        logo_url AS logoUrl,
        hindi_name AS hindiName,
        english_name AS englishName,
        subtitle,
        primary_color AS primaryColor,
        updated_at AS updatedAt
      FROM branding_config
      WHERE id = 1
      LIMIT 1
    `);

    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        branding: null,
      });
    }

    return res.json({
      success: true,
      branding: rows[0],
    });
  } catch (error: any) {
    console.error("GET /api/branding ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load organization branding.",
    });
  }
})

  // POST /api/branding
  app.post(
  "/api/branding",
  authenticateToken,
  requireBrandingAdministrator,
  async (req, res) => {
    try {
      if (!isDbConnected) {
        return res.status(503).json({
          success: false,
          message: "Branding database is unavailable. Changes were not saved.",
        });
      }

      const { logoUrl, hindiName, englishName, subtitle, primaryColor } =
        req.body || {};

      const cleanHindiName = String(
        hindiName ?? "भारतीय वन्यजीव संस्थान",
      ).trim();

      const cleanEnglishName = String(
        englishName ?? "Wildlife Institute of India",
      ).trim();

      const cleanSubtitle = String(subtitle ?? "").trim();
      const cleanPrimaryColor = String(primaryColor ?? "#7A1C1C").trim();

      if (!cleanHindiName || !cleanEnglishName) {
        return res.status(400).json({
          success: false,
          message: "Organization Hindi and English names are required.",
        });
      }

      // Logo is sent as a Base64 data URL by the current frontend.
      // 4 MB source image becomes larger after Base64 encoding, so
      // allow up to 7 MB for the request value itself.
      if (logoUrl != null) {
        if (typeof logoUrl !== "string") {
          return res.status(400).json({
            success: false,
            message: "Invalid logo data.",
          });
        }

        if (logoUrl.length > 7 * 1024 * 1024) {
          return res.status(413).json({
            success: false,
            message:
              "Logo image is too large. Please upload an image under 4MB.",
          });
        }

        if (
          logoUrl &&
          !/^data:image\/(png|jpe?g|webp|svg\+xml);base64,/i.test(logoUrl)
        ) {
          return res.status(400).json({
            success: false,
            message: "Unsupported logo format.",
          });
        }
      }

      if (!/^#[0-9a-fA-F]{6}$/.test(cleanPrimaryColor)) {
        return res.status(400).json({
          success: false,
          message: "Invalid primary color.",
        });
      }

      await db.query(
        `
        INSERT INTO branding_config
          (id, logo_url, hindi_name, english_name, subtitle, primary_color)
        VALUES
          (1, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          logo_url = VALUES(logo_url),
          hindi_name = VALUES(hindi_name),
          english_name = VALUES(english_name),
          subtitle = VALUES(subtitle),
          primary_color = VALUES(primary_color)
        `,
        [
          logoUrl || null,
          cleanHindiName,
          cleanEnglishName,
          cleanSubtitle,
          cleanPrimaryColor,
        ],
      );

      const [rows]: any = await db.query(`
        SELECT
          logo_url AS logoUrl,
          hindi_name AS hindiName,
          english_name AS englishName,
          subtitle,
          primary_color AS primaryColor,
          updated_at AS updatedAt
        FROM branding_config
        WHERE id = 1
        LIMIT 1
      `);

      return res.json({
        success: true,
        message: "Organization branding saved successfully.",
        branding: rows[0],
      });
    } catch (error: any) {
      console.error("POST /api/branding ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to save organization branding.",
      });
    }
  },
)
  // Existing server.ts functionality will be preserved during extraction.
}
