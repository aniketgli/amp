import type { Express } from "express";

import { authenticateToken } from "../middleware/auth";

import {
  getEmploymentTypes,
  getOrgUnits,
  getBanks,
  getBatchSeries,
  getBatches,
  getProfileOfficers,
} from "../controllers/profile-master.controller";

export function registerProfileMasterRoutes(
  app: Express,
) {
  /*
   * All Profile master data is authenticated.
   *
   * The frontend only consumes these APIs.
   * It does not own the authoritative master lists.
   */

  app.get(
    "/api/profile/masters/employment-types",
    authenticateToken,
    getEmploymentTypes,
  );

  app.get(
    "/api/profile/masters/org-units",
    authenticateToken,
    getOrgUnits,
  );

  app.get(
    "/api/profile/masters/banks",
    authenticateToken,
    getBanks,
  );

  app.get(
    "/api/profile/masters/batch-series",
    authenticateToken,
    getBatchSeries,
  );

  app.get(
    "/api/profile/masters/batches",
    authenticateToken,
    getBatches,
  );

  app.get(
    "/api/profile/masters/officers",
    authenticateToken,
    getProfileOfficers,
  );
}
