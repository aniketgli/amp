import type { Express } from "express";

import { isDbConnected } from "../db/connection";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/authorization";
import { ADMIN_ROLES } from "../config/constants";
import {
  getAllFacilities,
  getNextFacilityId,
  createFacility,
  updateFacility,
  deleteFacility,
} from "../repositories/facility.repository";

export function registerFacilitiesRoutes(app: Express) {
  app.get("/api/facilities", authenticateToken, async (_req, res) => {
    try {
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const rows = await getAllFacilities();
      const facilities = rows.map((row: any) => {
        let stages = null;
        if (row.workflow_stages) {
          try { stages = typeof row.workflow_stages === "string" ? JSON.parse(row.workflow_stages) : row.workflow_stages; }
          catch { stages = null; }
        }
        return {
          id: row.id,
          name: row.facility_name,
          dept: row.department || "",
          nodal: row.nodal_officer_name || "",
          assocNodal: row.assoc_nodal_officer_name || "",
          supervisor: row.supervisor_name || "",
          desc: row.description || "",
          status: row.status || "active",
          workflowStages: stages,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
      return res.json({ success: true, count: facilities.length, facilities });
    } catch (error) {
      console.error("GET /api/facilities ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to fetch facilities." });
    }
  });

  app.post("/api/facilities", authenticateToken, requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
      const { name, dept, nodal, assocNodal, supervisor, desc, status = "active", workflowStages = null } = req.body;
      if (!name || !nodal || !assocNodal || !supervisor) {
        return res.status(400).json({ success: false, message: "Facility name, Nodal Officer, Associate Nodal Officer and Supervisor are required." });
      }
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const facilityId = await getNextFacilityId();
      await createFacility({ id: facilityId, name: String(name).trim(), dept: dept || null, nodal: String(nodal).trim(), assocNodal: String(assocNodal).trim(), supervisor: String(supervisor).trim(), desc: desc || null, status, workflowStages });
      return res.status(201).json({ success: true, message: "Facility created successfully.", id: facilityId });
    } catch (error) {
      console.error("POST /api/facilities ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to create facility." });
    }
  });

  app.put("/api/facilities/:id", authenticateToken, requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, dept, nodal, assocNodal, supervisor, desc, status = "active", workflowStages = null } = req.body;
      if (!name || !nodal || !assocNodal || !supervisor) {
        return res.status(400).json({ success: false, message: "Facility name, Nodal Officer, Associate Nodal Officer and Supervisor are required." });
      }
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const updated = await updateFacility({ id, name: String(name).trim(), dept: dept || null, nodal: String(nodal).trim(), assocNodal: String(assocNodal).trim(), supervisor: String(supervisor).trim(), desc: desc === undefined ? null : desc, status, workflowStages });
      if (!updated || Number(updated.affectedRows || 0) === 0) return res.status(404).json({ success: false, message: "Facility not found." });
      return res.json({ success: true, message: "Facility updated successfully." });
    } catch (error) {
      console.error("PUT /api/facilities ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to update facility." });
    }
  });

  app.delete("/api/facilities/:id", authenticateToken, requireRole(...ADMIN_ROLES), async (req, res) => {
    try {
      if (!isDbConnected) return res.status(503).json({ success: false, message: "Database is unavailable." });
      const deleted = await deleteFacility(req.params.id);
      if (!deleted || Number(deleted.affectedRows || 0) === 0) return res.status(404).json({ success: false, message: "Facility not found." });
      return res.json({ success: true, message: "Facility deleted successfully." });
    } catch (error) {
      console.error("DELETE /api/facilities ERROR:", error);
      return res.status(500).json({ success: false, message: "Unable to delete facility." });
    }
  });
}
