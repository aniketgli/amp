import type { Express } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  getRequisitions,
  getRequisition,
  createRequisition,
  updateRequisition,
} from "../controllers/requisition.controller";

export function registerRequisitionRoutes(app: Express) {
  // List requisitions
  app.get(
    "/api/requisitions",
    authenticateToken,
    getRequisitions,
  );

  // Get one requisition
  app.get(
    "/api/requisitions/:id",
    authenticateToken,
    getRequisition,
  );

  // Create requisition
  app.post(
    "/api/requisitions",
    authenticateToken,
    createRequisition,
  );

  // Update requisition
  app.put(
    "/api/requisitions/:id",
    authenticateToken,
    updateRequisition,
  );
}
