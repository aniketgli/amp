import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import {
  PORT,
  JWT_SECRET,
  EMAIL_USER,
  EMAIL_PASS,
  GEMINI_API_KEY,
} from "./config/env";
import { ADMIN_ROLES } from "./config/constants";
import { db, testDatabaseConnection } from "./db/connection";
import { authenticateToken } from "./middleware/auth";
import { getUserRoles, requireRole } from "./middleware/authorization";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { registerAuthRoutes } from "./routes/auth.routes";
import { registerUsersRoutes } from "./routes/users.routes";
import { registerFacilitiesRoutes } from "./routes/facilities.routes";
import { registerServicesRoutes } from "./routes/services.routes";
import { registerAdminRoutes } from "./routes/admin.routes";
import { registerOfficeOrderRoutes } from "./routes/office-order.routes";

const app = express();

/* =========================================================
   SERVER CONFIGURATION
========================================================= */

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required.");
}

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

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(express.json({ limit: "25mb" }));

// Authentication routes
registerAuthRoutes(app);
registerUsersRoutes(app);
registerFacilitiesRoutes(app);
registerServicesRoutes(app);
registerAdminRoutes(app);
registerOfficeOrderRoutes(app);

app.use(express.urlencoded({ extended: true, limit: "25mb" }));

/* =========================================================
   AUTHENTICATION DATA SOURCE
   ---------------------------------------------------------
   Users, passwords and roles are stored in MySQL only.
   There is intentionally NO in-memory/demo authentication fallback.
========================================================= */

/* =========================================================
   IN-MEMORY FALLBACK STORE FOR FACILITIES & SERVICES
========================================================= */

interface InMemoryFacility {
  id: string;
  facility_name: string;
  department: string;
  nodal_officer_name: string;
  assoc_nodal_officer_name: string;
  supervisor_name: string;
  description: string;
  status: string;
  workflow_stages?: any;
  created_at?: string;
  updated_at?: string;
}

interface InMemoryService {
  id: string;
  service_name: string;
  manager_name: string;
  quota_access_specs: string;
  status: string;
  workflow_stages?: any;
  created_at?: string;
  updated_at?: string;
}

const defaultFacilityWorkflowStages = [
  {
    stageNumber: 1,
    stageName: "Supervising Officer / PI Endorsement",
    dealingRole: "reporting_manager",
    dealingOfficerName: "Applicant's Supervising Officer (PI)",
    actionType: "endorsement",
    isMandatory: true,
  },
  {
    stageNumber: 2,
    stageName: "Technical Supervisor Verification",
    dealingRole: "supervisor",
    dealingOfficerName: "Lab Technical Supervisor",
    actionType: "verification",
    isMandatory: true,
  },
  {
    stageNumber: 3,
    stageName: "Associate Nodal Officer Review",
    dealingRole: "assoc_nodal",
    dealingOfficerName: "Associate Nodal Officer",
    actionType: "verification",
    isMandatory: true,
  },
  {
    stageNumber: 4,
    stageName: "Nodal Officer Final Approval",
    dealingRole: "nodal",
    dealingOfficerName: "Nodal Officer",
    actionType: "approval",
    isMandatory: true,
  },
];

const defaultServiceWorkflowStages = [
  {
    stageNumber: 1,
    stageName: "Supervising Officer / PI Endorsement",
    dealingRole: "reporting_manager",
    dealingOfficerName: "Applicant's Supervising Officer (PI)",
    actionType: "endorsement",
    isMandatory: true,
  },
  {
    stageNumber: 2,
    stageName: "In-Charge Manager Verification",
    dealingRole: "manager",
    dealingOfficerName: "Service In-Charge Manager",
    actionType: "verification",
    isMandatory: true,
  },
  {
    stageNumber: 3,
    stageName: "IT Head / Admin Provisioning",
    dealingRole: "it_head",
    dealingOfficerName: "IT Officer / System Admin",
    actionType: "provisioning",
    isMandatory: true,
  },
];

const inMemoryFacilities: InMemoryFacility[] = [
  {
    id: "FAC-01",
    facility_name: "Wildlife Forensics & Conservation Genetics Laboratory",
    department: "Conservation Genetics Division",
    nodal_officer_name: "Dr. S. K. Gupta",
    assoc_nodal_officer_name: "Dr. Neha Verma",
    supervisor_name: "Mr. Harendra Kumar",
    description:
      "DNA extraction, species identification, wildlife forensic analysis, and population genetics.",
    status: "active",
    workflow_stages: defaultFacilityWorkflowStages,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "FAC-02",
    facility_name: "GIS & Remote Sensing Laboratory",
    department: "Landscape Ecology Division",
    nodal_officer_name: "Dr. S. K. Gupta",
    assoc_nodal_officer_name: "Dr. Neha Verma",
    supervisor_name: "Mr. Harendra Kumar",
    description:
      "Spatial mapping, habitat modeling, satellite imagery analysis, and land use mapping.",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "FAC-03",
    facility_name: "High Performance Computing & Bio-Informatics Cluster",
    department: "IT & Computational Biology Division",
    nodal_officer_name: "Mr. Dinesh Singh Pundir",
    assoc_nodal_officer_name: "Dr. Neha Verma",
    supervisor_name: "Mr. Harendra Kumar",
    description:
      "Genome assembly, phylogenetic trees, big data spatial modeling, and ML/AI simulations.",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "FAC-04",
    facility_name: "Isotope Ratio Mass Spectrometry (IRMS) Facility",
    department: "Ecology & Environmental Sciences",
    nodal_officer_name: "Dr. S. K. Gupta",
    assoc_nodal_officer_name: "Dr. Neha Verma",
    supervisor_name: "Dr. R. K. Singh",
    description:
      "Stable isotope analysis for animal diet tracing, ecological migration, and food web studies.",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "FAC-05",
    facility_name: "Wildlife Telemetry & Radio-Tracking Lab",
    department: "Animal Ecology & Management",
    nodal_officer_name: "Dr. Panna Lal",
    assoc_nodal_officer_name: "Dr. Neha Verma",
    supervisor_name: "Dr. R. K. Singh",
    description:
      "VHF/GPS Collar calibration, satellite receiver setup, and animal movement analytics.",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const inMemoryServices: InMemoryService[] = [
  {
    id: "SRV-01",
    service_name: "Sanger DNA Sequencing & Fragment Analysis",
    manager_name: "Dr. S. K. Gupta",
    quota_access_specs: "100 Samples / month",
    status: "active",
    workflow_stages: defaultServiceWorkflowStages,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "SRV-02",
    service_name: "Next Generation Sequencing (Illumina NovaSeq)",
    manager_name: "Dr. Neha Verma",
    quota_access_specs: "24 Libraries / run",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "SRV-03",
    service_name: "GIS High-Resolution Satellite Image Processing",
    manager_name: "Mr. Dinesh Singh Pundir",
    quota_access_specs: "50 GB Data Processing",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "SRV-04",
    service_name: "High Performance GPU Server Compute Node Access",
    manager_name: "Mr. Dinesh Singh Pundir",
    quota_access_specs: "500 GPU Hours / quarter",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "SRV-05",
    service_name: "Stable Isotope Ratio (C/N/O/S) Analysis",
    manager_name: "Dr. R. K. Singh",
    quota_access_specs: "50 Samples / batch",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/* =========================================================
   EMAIL TRANSPORTER
========================================================= */

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/* =========================================================
   GEMINI CLIENT
========================================================= */

function getGeminiClient() {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    server: "running",
    databaseConnected: isDbConnected,
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   DATABASE TEST API
========================================================= */;

/* =========================================================
   EMAIL TEST API
========================================================= */;

/* =========================================================
   STRING CLEANING / SIMILARITY HELPERS
========================================================= */

function cleanStr(s?: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/^(dr\.|mr\.|ms\.|mrs\.|prof\.)\s+/i, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function checkSimilarity(a?: string, b?: string): boolean {
  const cleanA = cleanStr(a);
  const cleanB = cleanStr(b);
  if (!cleanA || !cleanB) return true;
  if (cleanA === cleanB) return true;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
  const wordsA = cleanA.split(" ").filter((w) => w.length > 2);
  const wordsB = cleanB.split(" ").filter((w) => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return true;
  return wordsA.some((w) => wordsB.includes(w));
}

/* =========================================================
   REGISTRATION API
========================================================= */

;

/* =========================================================
   ACTIVATION API
========================================================= */

;

/* =========================================================
   LOGIN API
   ---------------------------------------------------------
   RULE:
   1. User authenticate hoga.
   2. User ki saari assigned roles DB se milengi.
   3. Login ke time ALWAYS "user" role currentRole hoga.
   4. Baaki roles roles[] me available rahengi.
========================================================= */

;

/* =========================================================
   ORGANIZATION BRANDING API
   ---------------------------------------------------------
   MySQL is the single source of truth for the organization
   logo, titles and primary colour.

   GET  /api/branding  -> public read (needed by login page)
   POST /api/branding  -> administrator only

   IMPORTANT:
   - Never fall back to localStorage on the server.
   - Never silently report success if the DB write fails.
   - Logo is currently stored as a Base64 data URL in LONGTEXT.
========================================================= */

;

/* ---------------------------------------------------------
   BRANDING ADMIN AUTHORIZATION
   --------------------------------------------------------- */

const requireBrandingAdministrator = requireRole(...ADMIN_ROLES);

/* ---------------------------------------------------------
   SAVE / UPDATE BRANDING
   --------------------------------------------------------- */

;

/* =========================================================
   CURRENT LOGGED-IN USER API
========================================================= */

;

/* =========================================================
   GET ALL USERS
   ---------------------------------------------------------
   Purpose:
   - Admin panel ke liye users DB se fetch karna
   - Koi hardcoded user use nahi hoga
   - Roles user_roles + roles se fetch honge
========================================================= */

;

/* =========================================================
   UPDATE USER ROLES
   Admin assigns/replaces multiple roles for a user.
========================================================= */

;
/* =========================================================
   FACILITIES MASTER API
   =========================================================
   All facility records come directly from MySQL.
   No hardcoded/localStorage facility records are used.
========================================================= */

/* Ensure workflow_stages column exists on facility_masters and service_masters */


/* GET ALL FACILITIES */
;

/* CREATE FACILITY */
;

/* UPDATE FACILITY */
;

/* DELETE FACILITY */
;

/* =========================================================
   SERVICES MASTER API
========================================================= */

/* GET ALL SERVICES */
;

/* CREATE SERVICE */
;

/* UPDATE SERVICE */
;

/* DELETE SERVICE */
;

/* =========================================================
   VITE DEVELOPMENT SERVER & STATIC SERVING
========================================================= */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  /* =========================================
     START SERVER
  ========================================= */

  await testDatabaseConnection();

  app.listen(PORT, "0.0.0.0", async () => {
    console.log("");
    console.log("============================================");
    console.log(" WII Requisition Portal Server Running");
    console.log("============================================");
    console.log(` Server URL: http://localhost:${PORT}`);
    console.log(` Port: ${PORT}`);
    console.log("============================================");
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});




