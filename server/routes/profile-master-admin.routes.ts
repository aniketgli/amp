import type { Express } from "express";

import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";

import {
  getAdminOrgUnits,
  getAdminBanks,
  getAdminBatches,
  createOrgUnit,
  updateOrgUnit,
  updateOrgUnitStatus,
  createBank,
  updateBank,
  updateBankStatus,
  createBatch,
  updateBatch,
  updateBatchStatus,
} from "../controllers/profile-master-admin.controller";

const requireAdministrator = requireRole("administrator");

export function registerProfileMasterAdminRoutes(app: Express) {
  /*
   * Every master-data operation requires:
   *
   * Authentication
   *        ↓
   * Administrator role from DB
   *        ↓
   * Controller
   *
   * Frontend role checks are NOT security boundaries.
   */

  // =========================================================
  // ORGANIZATION UNITS
  // =========================================================

  // Admin list — includes active + inactive records
  app.get(
    "/api/admin/profile-masters/org-units",
    authenticateToken,
    requireAdministrator,
    getAdminOrgUnits,
  );

  // Create
  app.post(
    "/api/admin/profile-masters/org-units",
    authenticateToken,
    requireAdministrator,
    createOrgUnit,
  );

  // Update
  app.put(
    "/api/admin/profile-masters/org-units/:id",
    authenticateToken,
    requireAdministrator,
    updateOrgUnit,
  );

  // Activate / deactivate
  app.patch(
    "/api/admin/profile-masters/org-units/:id/status",
    authenticateToken,
    requireAdministrator,
    updateOrgUnitStatus,
  );

  // =========================================================
  // BANKS
  // =========================================================

  // Admin list — includes active + inactive records
  app.get(
    "/api/admin/profile-masters/banks",
    authenticateToken,
    requireAdministrator,
    getAdminBanks,
  );

  // Create
  app.post(
    "/api/admin/profile-masters/banks",
    authenticateToken,
    requireAdministrator,
    createBank,
  );

  // Update
  app.put(
    "/api/admin/profile-masters/banks/:id",
    authenticateToken,
    requireAdministrator,
    updateBank,
  );

  // Activate / deactivate
  app.patch(
    "/api/admin/profile-masters/banks/:id/status",
    authenticateToken,
    requireAdministrator,
    updateBankStatus,
  );

  // =========================================================
  // BATCHES
  // =========================================================

  // Admin list — includes active + inactive records
  app.get(
    "/api/admin/profile-masters/batches",
    authenticateToken,
    requireAdministrator,
    getAdminBatches,
  );

  // Create
  app.post(
    "/api/admin/profile-masters/batches",
    authenticateToken,
    requireAdministrator,
    createBatch,
  );

  // Update
  app.put(
    "/api/admin/profile-masters/batches/:id",
    authenticateToken,
    requireAdministrator,
    updateBatch,
  );

  // Activate / deactivate
  app.patch(
    "/api/admin/profile-masters/batches/:id/status",
    authenticateToken,
    requireAdministrator,
    updateBatchStatus,
  );
}
