import type { Express } from "express";

import { db, isDbConnected } from "../db/connection";
import { authenticateToken } from "../middleware/auth";
import {
  getAllFacilities,
  getNextFacilityId,
  createFacility,
  updateFacility,
  deleteFacility,
} from "../repositories/facility.repository";

export function registerFacilitiesRoutes(app: Express) {

  // GET /api/facilities
app.get("/api/facilities", authenticateToken, async (req, res) => {
  try {
    if (isDbConnected) {
      try {
        const rows = await getAllFacilities();

        const facilities = rows.map((row: any) => {
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
            name: row.facility_name,
            dept: row.department || "",
            nodal: row.nodal_officer_name || "",
            assocNodal: row.assoc_nodal_officer_name || "",
            supervisor: row.supervisor_name || "",
            desc: row.description || "",
            status: row.status || "active",
            workflowStages: stages || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });

        return res.json({
          success: true,
          count: facilities.length,
          facilities,
        });
      } catch (dbErr) {
        console.warn(
          "MySQL GET /api/facilities error, falling back to in-memory store.",
        );
      }
    }

    const facilities = inMemoryFacilities.map((f) => ({
      id: f.id,
      name: f.facility_name,
      dept: f.department || "",
      nodal: f.nodal_officer_name || "",
      assocNodal: f.assoc_nodal_officer_name || "",
      supervisor: f.supervisor_name || "",
      desc: f.description || "",
      status: f.status || "active",
      workflowStages: f.workflow_stages || null,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    }));

    return res.json({
      success: true,
      count: facilities.length,
      facilities,
    });
  } catch (error: any) {
    console.error("GET /api/facilities ERROR:", error);

    const facilities = inMemoryFacilities.map((f) => ({
      id: f.id,
      name: f.facility_name,
      dept: f.department || "",
      nodal: f.nodal_officer_name || "",
      assocNodal: f.assoc_nodal_officer_name || "",
      supervisor: f.supervisor_name || "",
      desc: f.description || "",
      status: f.status || "active",
      workflowStages: f.workflow_stages || null,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    }));

    return res.json({
      success: true,
      count: facilities.length,
      facilities,
    });
  }
})

// POST /api/facilities
  app.post(
  "/api/facilities",
  authenticateToken,
  requireRole(...ADMIN_ROLES),
  async (req, res) => {
    try {
      const {
        name,
        dept,
        nodal,
        assocNodal,
        supervisor,
        desc,
        status = "active",
        workflowStages = null,
      } = req.body;

      if (!name || !nodal || !assocNodal || !supervisor) {
        return res.status(400).json({
          success: false,
          message:
            "Facility name, Nodal Officer, Associate Nodal Officer and Supervisor are required.",
        });
      }

      if (isDbConnected) {
        try {
          const facilityId = await getNextFacilityId();

          await createFacility({
            facilityId,
            name: String(name).trim(),
            dept: dept || null,
            nodal: String(nodal).trim(),
            assocNodal: String(assocNodal).trim(),
            supervisor: String(supervisor).trim(),
            desc: desc || null,
            status,
            workflowStages,
          });

          return res.status(201).json({
            success: true,
            message: "Facility created successfully.",
            id: facilityId,
          });
        } catch (dbErr) {
          console.warn(
            "MySQL POST /api/facilities error, falling back to in-memory store.",
          );
        }
      }

      // Fallback to in-memory
      const numbers = inMemoryFacilities
        .map((f) => {
          const match = String(f.id).match(/FAC-(\d+)/i);
          return match ? Number(match[1]) : 0;
        })
        .filter((n) => Number.isFinite(n));
      const nextNum =
        numbers.length > 0
          ? Math.max(...numbers) + 1
          : inMemoryFacilities.length + 1;
      const facilityId = `FAC-${String(nextNum).padStart(2, "0")}`;

      const newFac: InMemoryFacility = {
        id: facilityId,
        facility_name: String(name).trim(),
        department: dept || "Research Laboratories Division",
        nodal_officer_name: String(nodal).trim(),
        assoc_nodal_officer_name: String(assocNodal).trim(),
        supervisor_name: String(supervisor).trim(),
        description: desc || "",
        status,
        workflow_stages: workflowStages || defaultFacilityWorkflowStages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      inMemoryFacilities.unshift(newFac);

      return res.status(201).json({
        success: true,
        message: "Facility created successfully.",
        id: facilityId,
      });
    } catch (error: any) {
      console.error("POST /api/facilities ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to create facility.",
        error: undefined,
      });
    }
  },
)

  // PUT /api/facilities/:id
  app.put(
  "/api/facilities/:id",
  authenticateToken,
  requireRole(...ADMIN_ROLES),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        dept,
        nodal,
        assocNodal,
        supervisor,
        desc,
        status,
        workflowStages,
      } = req.body;

      if (!name || !nodal || !assocNodal || !supervisor) {
        return res.status(400).json({
          success: false,
          message:
            "Facility name, Nodal Officer, Associate Nodal Officer and Supervisor are required.",
        });
      }

      if (isDbConnected) {
        try {
          const updated = await updateFacility(id, {
            name: String(name).trim(),
            dept: dept || null,
            nodal: String(nodal).trim(),
            assocNodal: String(assocNodal).trim(),
            supervisor: String(supervisor).trim(),
            desc: desc === undefined ? null : desc,
            status: status || "active",
            workflowStages:
              workflowStages === undefined ? null : workflowStages,
          });

          if (updated) {
            return res.json({
              success: true,
              message: "Facility updated successfully.",
            });
          }
        } catch (dbErr) {
          console.warn(
            "MySQL PUT /api/facilities error, falling back to in-memory store.",
          );
        }
      }

      // In-memory fallback
      const target = inMemoryFacilities.find((f) => f.id === id);
      if (target) {
        target.facility_name = String(name).trim();
        if (dept) target.department = dept;
        target.nodal_officer_name = String(nodal).trim();
        target.assoc_nodal_officer_name = String(assocNodal).trim();
        target.supervisor_name = String(supervisor).trim();
        if (desc !== undefined) target.description = desc;
        if (status) target.status = status;
        if (workflowStages) target.workflow_stages = workflowStages;
        target.updated_at = new Date().toISOString();
      }

      return res.json({
        success: true,
        message: "Facility updated successfully.",
      });
    } catch (error: any) {
      console.error("PUT /api/facilities ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to update facility.",
        error: undefined,
      });
    }
  },
)

  // DELETE /api/facilities/:id
  app.delete(
  "/api/facilities/:id",
  authenticateToken,
  requireRole(...ADMIN_ROLES),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (isDbConnected) {
        try {
          const deleted = await deleteFacility(id);

          if (deleted) {
            return res.json({
              success: true,
              message: "Facility deleted successfully.",
            });
          }
        } catch (dbErr) {
          console.warn(
            "MySQL DELETE /api/facilities error, falling back to in-memory store.",
          );
        }
      }

      const index = inMemoryFacilities.findIndex((f) => f.id === id);
      if (index !== -1) {
        inMemoryFacilities.splice(index, 1);
      }

      return res.json({
        success: true,
        message: "Facility deleted successfully.",
      });
    } catch (error: any) {
      console.error("DELETE /api/facilities ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to delete facility.",
        error: undefined,
      });
    }
  },
)
}

