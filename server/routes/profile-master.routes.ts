import type { Express } from "express";
import { authenticateToken } from "../middleware/auth";
import * as controller from "../controllers/profile-master.controller";

export function registerProfileMasterRoutes(app: Express) {
  app.get("/api/profile/masters/employment-types", authenticateToken, controller.getEmploymentTypes);
  app.get("/api/profile/masters/org-units", authenticateToken, controller.getOrgUnits);
  app.get("/api/profile/masters/banks", authenticateToken, controller.getBanks);
  app.get("/api/profile/masters/designations", authenticateToken, controller.getDesignations);
  app.get("/api/profile/masters/streams", authenticateToken, controller.getStreams);
  app.get("/api/profile/masters/msc-batches", authenticateToken, controller.getMscBatches);
  app.get("/api/profile/masters/courses", authenticateToken, controller.getCourses);
  app.get("/api/profile/masters/trainee-batches", authenticateToken, controller.getTraineeBatches);
  app.get("/api/profile/masters/officers", authenticateToken, controller.getProfileOfficers);
  // Legacy compatibility while existing profile screens migrate.
  app.get("/api/profile/masters/batch-series", authenticateToken, controller.getBatchSeries);
  app.get("/api/profile/masters/batches", authenticateToken, controller.getBatches);
}
