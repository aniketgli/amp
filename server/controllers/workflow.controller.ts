import type { Request, Response } from "express";

import { getUserById } from "../repositories/user.repository";
import {
  executeWorkflowAction,
  WorkflowRole,
} from "../services/workflow.service";

export async function executeWorkflow(
  req: Request & { user?: any },
  res: Response,
) {
  try {
    const actorId = String(
      req.user?.userId || "",
    ).trim();

    const actorRole = String(
      req.user?.role || "",
    ).trim().toLowerCase() as WorkflowRole;

    if (!actorId || !actorRole) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user and role are required.",
      });
    }

    const actor = await getUserById(actorId);

    if (!actor) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user account no longer exists.",
      });
    }

    if (
      Number(actor.is_activated) !== 1 ||
      String(actor.status).toLowerCase() !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive.",
      });
    }

    // Always trust the role from the verified JWT/database identity.
    // Never accept actorRole / actorName from request body.
    if (
      actor.role &&
      String(actor.role).toLowerCase() !== actorRole
    ) {
      return res.status(403).json({
        success: false,
        message: "Authentication role mismatch.",
      });
    }

    const requisitionId = String(
      req.params.id || "",
    ).trim();

    if (!requisitionId) {
      return res.status(400).json({
        success: false,
        message: "Requisition ID is required.",
      });
    }

    const body = req.body || {};

    const result = await executeWorkflowAction({
      requisitionId,
      actorId,
      actorName: actor.full_name,
      actorRole,
      action: body.action,
      comments:
        body.comments === undefined
          ? null
          : String(body.comments),

      ipAddress:
        req.ip ||
        req.socket.remoteAddress ||
        "127.0.0.1",

      labFacilities: body.labFacilities,

      provisionedEmail:
        body.provisionedEmail,

      provisionedMac:
        body.provisionedMac,

      provisionedHrmsId:
        body.provisionedHrmsId,

      provisionedBiometricId:
        body.provisionedBiometricId,
    });

    return res.json({
      success: true,
      message:
        "Workflow action completed successfully.",
      result,
    });
  } catch (error: any) {
    console.error(
      "POST /api/requisitions/:id/actions ERROR:",
      error,
    );

    const statusCode =
      Number.isInteger(error?.statusCode)
        ? error.statusCode
        : 400;

    return res.status(statusCode).json({
      success: false,
      message:
        error?.message ||
        "Unable to execute workflow action.",
    });
  }
}
