import type { Express } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";
import * as controller from "../controllers/profile-master-admin.controller";

const administrator = requireRole("administrator");

export function registerProfileMasterAdminRoutes(app: Express) {
  app.get("/api/admin/profile-masters/employment-types", authenticateToken, administrator, controller.getAdminEmploymentTypes);
  app.post("/api/admin/profile-masters/employment-types", authenticateToken, administrator, controller.createEmploymentType);
  app.put("/api/admin/profile-masters/employment-types/:id", authenticateToken, administrator, controller.updateEmploymentType);
  app.patch("/api/admin/profile-masters/employment-types/:id/status", authenticateToken, administrator, controller.updateEmploymentTypeStatus);
  app.get("/api/admin/profile-masters/org-units", authenticateToken, administrator, controller.getAdminOrgUnits);
  app.post("/api/admin/profile-masters/org-units", authenticateToken, administrator, controller.createOrgUnit);
  app.put("/api/admin/profile-masters/org-units/:id", authenticateToken, administrator, controller.updateOrgUnit);
  app.patch("/api/admin/profile-masters/org-units/:id/status", authenticateToken, administrator, controller.updateOrgUnitStatus);
  app.get("/api/admin/profile-masters/banks", authenticateToken, administrator, controller.getAdminBanks);
  app.post("/api/admin/profile-masters/banks", authenticateToken, administrator, controller.createBank);
  app.put("/api/admin/profile-masters/banks/:id", authenticateToken, administrator, controller.updateBank);
  app.patch("/api/admin/profile-masters/banks/:id/status", authenticateToken, administrator, controller.updateBankStatus);
  app.get("/api/admin/profile-masters/designations", authenticateToken, administrator, controller.getAdminDesignations);
  app.post("/api/admin/profile-masters/designations", authenticateToken, administrator, controller.createDesignation);
  app.put("/api/admin/profile-masters/designations/:id", authenticateToken, administrator, controller.updateDesignation);
  app.patch("/api/admin/profile-masters/designations/:id/status", authenticateToken, administrator, controller.updateDesignationStatus);
  app.get("/api/admin/profile-masters/streams", authenticateToken, administrator, controller.getAdminStreams);
  app.post("/api/admin/profile-masters/streams", authenticateToken, administrator, controller.createStream);
  app.put("/api/admin/profile-masters/streams/:id", authenticateToken, administrator, controller.updateStream);
  app.patch("/api/admin/profile-masters/streams/:id/status", authenticateToken, administrator, controller.updateStreamStatus);
  app.get("/api/admin/profile-masters/msc-batches", authenticateToken, administrator, controller.getAdminMscBatches);
  app.post("/api/admin/profile-masters/msc-batches", authenticateToken, administrator, controller.createMscBatch);
  app.put("/api/admin/profile-masters/msc-batches/:id", authenticateToken, administrator, controller.updateMscBatch);
  app.patch("/api/admin/profile-masters/msc-batches/:id/status", authenticateToken, administrator, controller.updateMscBatchStatus);
  app.get("/api/admin/profile-masters/courses", authenticateToken, administrator, controller.getAdminCourses);
  app.post("/api/admin/profile-masters/courses", authenticateToken, administrator, controller.createCourse);
  app.put("/api/admin/profile-masters/courses/:id", authenticateToken, administrator, controller.updateCourse);
  app.patch("/api/admin/profile-masters/courses/:id/status", authenticateToken, administrator, controller.updateCourseStatus);
  app.get("/api/admin/profile-masters/trainee-batches", authenticateToken, administrator, controller.getAdminTraineeBatches);
  app.post("/api/admin/profile-masters/trainee-batches", authenticateToken, administrator, controller.createTraineeBatch);
  app.put("/api/admin/profile-masters/trainee-batches/:id", authenticateToken, administrator, controller.updateTraineeBatch);
  app.patch("/api/admin/profile-masters/trainee-batches/:id/status", authenticateToken, administrator, controller.updateTraineeBatchStatus);

  // Temporary read compatibility for the legacy Profile Masters UI.
  app.get("/api/admin/profile-masters/batches", authenticateToken, administrator, controller.getLegacyBatches);
}
