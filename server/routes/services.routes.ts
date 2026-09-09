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
  deleteService,
} from "../repositories/service.repository";

export function registerServicesRoutes(app: Express) {
  app.get("/api/services", authenticateToken, async (_req, res) => {
    try {
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const rows = await getAllServices();
      const services = rows.map((row: any) => {
        let stages = null;
        if (row.workflow_stages) {
          try { stages = typeof row.workflow_stages === "string" ? JSON.parse(row.workflow_stages) : row.workflow_stages; }
          catch { stages = null; }
        }
        return { id: row.id, name: row.service_name, manager: row.manager_name || "", quota: row.quota_access_specs || "", status: row.status || "active", workflowStages: stages, createdAt: row.created_at, updatedAt: row.updated_at };
      });
      return res.json({ success: true, count: services.length, services });
    } catch (error) {
      console.error("GET /api/services ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to fetch services." });
    }
  });

  app.post("/api/services", authenticateToken, requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
      const { name, manager, quota, status = "active", workflowStages = null } = req.body;
      if (!name || !manager) return res.status(400).json({ success: false, message: "Service name and Manager are required." });
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const serviceId = await getNextServiceId();
      await createService({ id: serviceId, name: String(name).trim(), manager: String(manager).trim(), quota: quota || null, status, workflowStages });
      return res.status(201).json({ success: true, message: "Service created successfully.", id: serviceId });
    } catch (error) {
      console.error("POST /api/services ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to create service." });
    }
  });

  app.put("/api/services/:id", authenticateToken, requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
      const { name, manager, quota, status = "active", workflowStages = null } = req.body;
      if (!name || !manager) return res.status(400).json({ success: false, message: "Service name and Manager are required." });
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const updated = await updateService({ id: req.params.id, name: String(name).trim(), manager: String(manager).trim(), quota: quota === undefined ? null : quota, status, workflowStages });
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
