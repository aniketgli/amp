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

  // GET /api/services
  app.get("/api/services", authenticateToken, async (req, res) => {
  try {
    if (isDbConnected) {
      try {
        const rows = await getAllServices();

        const services = rows.map((row: any) => {
          let stages = null;

          if (row.workflow_stages) {
            try {
              stages =
                typeof row.workflow_stages === "string"
                  ? JSON.parse(row.workflow_stages)
                  : row.workflow_stages;
            } catch (_) {}
          }

          return {
            id: row.id,
            name: row.service_name,
            manager: row.manager_name || "",
            quota: row.quota_access_specs || "",
            status: row.status || "active",
            workflowStages: stages || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });

        return res.json({
          success: true,
          count: services.length,
          services,
        });
      } catch (dbErr) {
        console.warn(
          "MySQL GET /api/services error, falling back to in-memory store.",
        );
      }
    }

    const services = inMemoryServices.map((s) => ({
      id: s.id,
      name: s.service_name,
      manager: s.manager_name || "",
      quota: s.quota_access_specs || "",
      status: s.status || "active",
      workflowStages: s.workflow_stages || null,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return res.json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error: any) {
    console.error("GET /api/services ERROR:", error);
    const services = inMemoryServices.map((s) => ({
      id: s.id,
      name: s.service_name,
      manager: s.manager_name || "",
      quota: s.quota_access_specs || "",
      status: s.status || "active",
      workflowStages: s.workflow_stages || null,
    }));

    return res.json({
      success: true,
      count: services.length,
      services,
    });
  }
})

  // POST /api/services
  app.post(
  "/api/services",
  authenticateToken,
  requireRole(...ADMIN_ROLES),
  async (req, res) => {
    try {
      const {
        name,
        manager,
        quota,
        status = "active",
        workflowStages = null,
      } = req.body;

      if (!name || !manager) {
        return res.status(400).json({
          success: false,
          message: "Service name and Manager are required.",
        });
      }

      if (isDbConnected) {
        try {
          const serviceId = await getNextServiceId();

          await createService({
            serviceId,
            name: String(name).trim(),
            manager: String(manager).trim(),
            quota: quota || null,
            status,
            workflowStages,
          });

          return res.status(201).json({
            success: true,
            message: "Service created successfully.",
            id: serviceId,
          });
        } catch (dbErr) {
          console.warn(
            "MySQL POST /api/services error, falling back to in-memory store.",
          );
        }
      }

      const numbers = inMemoryServices
        .map((s) => {
          const match = String(s.id).match(/SRV-(\d+)/i);
          return match ? Number(match[1]) : 0;
        })
        .filter((n) => Number.isFinite(n));
      const nextNum =
        numbers.length > 0
          ? Math.max(...numbers) + 1
          : inMemoryServices.length + 1;
      const serviceId = `SRV-${String(nextNum).padStart(2, "0")}`;

      const newSrv: InMemoryService = {
        id: serviceId,
        service_name: String(name).trim(),
        manager_name: String(manager).trim(),
        quota_access_specs: quota || "",
        status,
        workflow_stages: workflowStages || defaultServiceWorkflowStages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      inMemoryServices.unshift(newSrv);

      return res.status(201).json({
        success: true,
        message: "Service created successfully.",
        id: serviceId,
      });
    } catch (error: any) {
      console.error("POST /api/services ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to create service.",
        error: undefined,
      });
    }
  },
)

  // PUT /api/services/:id
  app.put(
  "/api/services/:id",
  authenticateToken,
  requireRole(...ADMIN_ROLES),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, manager, quota, status, workflowStages } = req.body;

      if (!name || !manager) {
        return res.status(400).json({
          success: false,
          message: "Service name and Manager are required.",
        });
      }

      if (isDbConnected) {
        try {
          const updated = await updateService(id, {
            name: String(name).trim(),
            manager: String(manager).trim(),
            quota: quota === undefined ? null : quota,
            status: status || "active",
            workflowStages:
              workflowStages === undefined ? null : workflowStages,
          });

          if (updated) {
            return res.json({
              success: true,
              message: "Service updated successfully.",
            });
          }
        } catch (dbErr) {
          console.warn(
            "MySQL PUT /api/services error, falling back to in-memory store.",
          );
        }
      }

      const target = inMemoryServices.find((s) => s.id === id);
      if (target) {
        target.service_name = String(name).trim();
        target.manager_name = String(manager).trim();
        if (quota !== undefined) target.quota_access_specs = quota;
        if (status) target.status = status;
        if (workflowStages) target.workflow_stages = workflowStages;
        target.updated_at = new Date().toISOString();
      }

      return res.json({
        success: true,
        message: "Service updated successfully.",
      });
    } catch (error: any) {
      console.error("PUT /api/services ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to update service.",
        error: undefined,
      });
    }
  },
)

  // DELETE /api/services/:id
  app.delete(
  "/api/services/:id",
  authenticateToken,
  requireRole(...ADMIN_ROLES),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (isDbConnected) {
        try {
          const deleted = await deleteService(id);

          if (deleted) {
            return res.json({
              success: true,
              message: "Service deleted successfully.",
            });
          }
        } catch (dbErr) {
          console.warn(
            "MySQL DELETE /api/services error, falling back to in-memory store.",
          );
        }
      }

      const index = inMemoryServices.findIndex((s) => s.id === id);
      if (index !== -1) {
        inMemoryServices.splice(index, 1);
      }

      return res.json({
        success: true,
        message: "Service deleted successfully.",
      });
    } catch (error: any) {
      console.error("DELETE /api/services ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to delete service.",
        error: undefined,
      });
    }
  },
)
}

