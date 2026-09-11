import type { Express } from "express";

import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";

import {
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

const requireAdministrator = requireRole(
  "administrator",
);

export function registerProfileMasterAdminRoutes(
  app: Express,
) {
  /*
   * Every master-data mutation requires:
   *
   * Authentication
   *        ?
   * Administrator role from DB
   *        ?
   * Controller
   *
   * Frontend role checks are NOT security boundaries.
   */

  // Organization Units
  app.post(
    "/api/admin/profile-masters/org-units",
    authenticateToken,
    requireAdministrator,
    createOrgUnit,
  );

  app.put(
    "/api/admin/profile-masters/org-units/:id",
    authenticateToken,
    requireAdministrator,
    updateOrgUnit,
  );

  app.patch(
    "/api/admin/profile-masters/org-units/:id/status",
    authenticateToken,
    requireAdministrator,
    updateOrgUnitStatus,
  );

  // Banks
  app.post(
    "/api/admin/profile-masters/banks",
    authenticateToken,
    requireAdministrator,
    createBank,
  );

  app.put(
    "/api/admin/profile-masters/banks/:id",
    authenticateToken,
    requireAdministrator,
    updateBank,
  );

  app.patch(
    "/api/admin/profile-masters/banks/:id/status",
    authenticateToken,
    requireAdministrator,
    updateBankStatus,
  );

  // Batches
  app.post(
    "/api/admin/profile-masters/batches",
    authenticateToken,
    requireAdministrator,
    createBatch,
  );

  app.put(
    "/api/admin/profile-masters/batches/:id",
    authenticateToken,
    requireAdministrator,
    updateBatch,
  );

  app.patch(
    "/api/admin/profile-masters/batches/:id/status",
    authenticateToken,
    requireAdministrator,
    updateBatchStatus,
  );
}
