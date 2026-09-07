import type { Express } from "express";

import { db, isDbConnected } from "../db/connection";
import { authenticateToken } from "../middleware/auth";

export function registerFacilitiesRoutes(app: Express) {

  // GET /api/facilities
  app.get("/api/facilities", authenticateToken, async (req, res) => {
  try {
    if (isDbConnected) {
      try {
        let rows: any = [];
        try {
          const [resRows]: any = await db.query(`
            SELECT
              id,
              facility_name,
              department,
              nodal_officer_name,
              assoc_nodal_officer_name,
              supervisor_name,
              description,
              status,
              workflow_stages,
              created_at,
              updated_at
            FROM facility_masters
            ORDER BY id
          `);
          rows = resRows;
        } catch (_) {
          const [resRows]: any = await db.query(`
            SELECT
              id,
              facility_name,
              department,
              nodal_officer_name,
              assoc_nodal_officer_name,
              supervisor_name,
              description,
              status,
              created_at,
              updated_at
            FROM facility_masters
            ORDER BY id
          `);
          rows = resRows;
        }

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
          const [existing]: any = await db.query(`
          SELECT id
          FROM facility_masters
          WHERE id LIKE 'FAC-%'
          ORDER BY id DESC
        `);

          let nextNumber = 1;
          if (existing.length > 0) {
            const numbers = existing
              .map((row: any) => {
                const match = String(row.id).match(/FAC-(\d+)/i);
                return match ? Number(match[1]) : 0;
              })
              .filter((n: number) => Number.isFinite(n));

            if (numbers.length > 0) {
              nextNumber = Math.max(...numbers) + 1;
            }
          }

          const facilityId = `FAC-${String(nextNumber).padStart(2, "0")}`;
          const stagesJson = workflowStages
            ? JSON.stringify(workflowStages)
            : null;

          try {
            await db.query(
              `
            INSERT INTO facility_masters
            (id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status, workflow_stages)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
              [
                facilityId,
                String(name).trim(),
                dept || null,
                String(nodal).trim(),
                String(assocNodal).trim(),
                String(supervisor).trim(),
                desc || null,
                status,
                stagesJson,
              ],
            );
          } catch (_) {
            await db.query(
              `
            INSERT INTO facility_masters
            (id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
              [
                facilityId,
                String(name).trim(),
                dept || null,
                String(nodal).trim(),
                String(assocNodal).trim(),
                String(supervisor).trim(),
                desc || null,
                status,
              ],
            );
          }

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
          const stagesJson = workflowStages
            ? JSON.stringify(workflowStages)
            : null;
          let result: any;
          try {
            const [resRes]: any = await db.query(
              `
            UPDATE facility_masters
            SET facility_name = ?, department = ?, nodal_officer_name = ?, assoc_nodal_officer_name = ?, supervisor_name = ?, description = ?, status = ?, workflow_stages = ?
            WHERE id = ?
            `,
              [
                String(name).trim(),
                dept || null,
                String(nodal).trim(),
                String(assocNodal).trim(),
                String(supervisor).trim(),
                desc || null,
                status || "active",
                stagesJson,
                id,
              ],
            );
            result = resRes;
          } catch (_) {
            const [resRes]: any = await db.query(
              `
            UPDATE facility_masters
            SET facility_name = ?, department = ?, nodal_officer_name = ?, assoc_nodal_officer_name = ?, supervisor_name = ?, description = ?, status = ?
            WHERE id = ?
            `,
              [
                String(name).trim(),
                dept || null,
                String(nodal).trim(),
                String(assocNodal).trim(),
                String(supervisor).trim(),
                desc || null,
                status || "active",
                id,
              ],
            );
            result = resRes;
          }

          if (result && result.affectedRows > 0) {
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
          const [result]: any = await db.query(
            `DELETE FROM facility_masters WHERE id = ?`,
            [id],
          );
          if (result && result.affectedRows > 0) {
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
