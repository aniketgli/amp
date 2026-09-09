import type { Express } from "express";
import { authenticateToken } from "../middleware/auth";
import { executeWorkflow } from "../controllers/workflow.controller";

export function registerWorkflowRoutes(app: Express) {
  // Execute an approval / rejection / provisioning action.
  app.post(
    "/api/requisitions/:id/actions",
    authenticateToken,
    executeWorkflow,
  );
}
