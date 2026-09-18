import type { Express } from "express";

import { isDbConnected } from "../db/connection";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";
import { ADMIN_ROLES } from "../config/constants";
import {
  getAllServices,
  getNextServiceId,
  createService,
  updateService,
  updateServiceStatus,
  deleteService,
  ensureRequiredAccessServices,
} from "../repositories/service.repository";

function parseJson(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return null; }
}

export function registerServicesRoutes(app: Express) {
  app.get("/api/services", authenticateToken, async (_req, res) => {
    try {
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      await ensureRequiredAccessServices();
      const rows = await getAllServices();
      const services = rows.map((row: any) => {
        const formConfig = parseJson(row.form_config);
        return {
          id: row.id,
          name: row.service_name,
          manager: row.manager_name || "",
          quota: row.quota_access_specs || "",
          status: row.status || "active",
          workflowStages: parseJson(row.workflow_stages) || formConfig?.approvalWorkflowStages || null,
          formConfig,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
      return res.json({ success: true, count: services.length, services });
    } catch (error) {
      console.error("GET /api/services ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to fetch services." });
    }
  });

  app.post("/api/services", authenticateToken, requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
      const { name, manager, quota, status = "active", workflowStages = null, formConfig = null } = req.body;
      if (!name || !manager) return res.status(400).json({ success: false, message: "Service name and Manager are required." });
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const serviceId = await getNextServiceId();
      await createService({ id: serviceId, name: String(name).trim(), manager: String(manager).trim(), quota: quota || null, status, workflowStages, formConfig });
      return res.status(201).json({ success: true, message: "Service created successfully.", id: serviceId });
    } catch (error) {
      console.error("POST /api/services ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to create service." });
    }
  });

  app.patch("/api/services/:id/status", authenticateToken, requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
      const status = String(req.body?.status || "").toLowerCase();
      if (status !== "active" && status !== "inactive") {
        return res.status(400).json({ success: false, message: "Status must be active or inactive." });
      }
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const updated = await updateServiceStatus(req.params.id, status as "active" | "inactive");
      if (!updated || Number(updated.affectedRows || 0) === 0) {
        return res.status(404).json({ success: false, message: "Service not found." });
      }
      return res.json({ success: true, status, message: `Service marked ${status}.` });
    } catch (error) {
      console.error("PATCH /api/services/:id/status ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to update service status." });
    }
  });

  app.put("/api/services/:id", authenticateToken, requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
      const { name, manager, quota, status = "active", workflowStages = null, formConfig = null } = req.body;
      if (!name || !manager) return res.status(400).json({ success: false, message: "Service name and Manager are required." });
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const updated = await updateService({ id: req.params.id, name: String(name).trim(), manager: String(manager).trim(), quota: quota === undefined ? null : quota, status, workflowStages, formConfig });
      if (!updated || Number(updated.affectedRows || 0) === 0) return res.status(404).json({ success: false, message: "Service not found." });
      return res.json({ success: true, message: "Service updated successfully." });
    } catch (error) {
      console.error("PUT /api/services ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to update service." });
    }
  });

  app.delete("/api/services/:id", authenticateToken, requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const deleted = await deleteService(req.params.id);
      if (!deleted || Number(deleted.affectedRows || 0) === 0) return res.status(404).json({ success: false, message: "Service not found." });
      return res.json({ success: true, message: "Service deleted successfully." });
    } catch (error) {
      console.error("DELETE /api/services ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to delete service." });
    }
  });
}
