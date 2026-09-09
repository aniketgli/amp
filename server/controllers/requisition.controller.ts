import type { Request, Response } from "express";

import {
  listRequisitionsForActor,
  findRequisitionForActor,
  createNewRequisition,
  updateExistingRequisition,
  normalizeRole,
} from "../services/requisition.service";

import { isDbConnected } from "../db/connection";

export async function getRequisitions(
  req: Request & { user?: any },
  res: Response,
) {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database is unavailable.",
      });
    }

    const actorId =
      String(req.user?.userId || "").trim();

    const actorRole = normalizeRole(
      req.user?.role,
    );

    if (!actorId || !actorRole) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user is required.",
      });
    }

    const rows =
      await listRequisitionsForActor(
        actorId,
        actorRole,
      );

    return res.json({
      success: true,
      count: rows.length,
      requisitions: rows,
    });
  } catch (error) {
    console.error(
      "GET /api/requisitions ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch requisitions.",
    });
  }
}

export async function getRequisition(
  req: Request & { user?: any },
  res: Response,
) {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database is unavailable.",
      });
    }

    const actorId =
      String(req.user?.userId || "").trim();

    const actorRole = normalizeRole(
      req.user?.role,
    );

    const requisitionId =
      String(req.params.id || "").trim();

    if (!actorId || !actorRole) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user is required.",
      });
    }

    if (!requisitionId) {
      return res.status(400).json({
        success: false,
        message: "Requisition ID is required.",
      });
    }

    const requisition =
      await findRequisitionForActor(
        requisitionId,
        actorId,
        actorRole,
      );

    if (!requisition) {
      // Do not reveal whether an unauthorized record exists.
      return res.status(404).json({
        success: false,
        message: "Requisition not found.",
      });
    }

    return res.json({
      success: true,
      requisition,
    });
  } catch (error) {
    console.error(
      "GET /api/requisitions/:id ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch requisition.",
    });
  }
}

export async function createRequisition(
  req: Request & { user?: any },
  res: Response,
) {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database is unavailable.",
      });
    }

    const actorId =
      String(req.user?.userId || "").trim();

    const actorRole = normalizeRole(
      req.user?.role,
    );

    if (!actorId || !actorRole) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user is required.",
      });
    }

    const body = req.body || {};

    const result =
      await createNewRequisition(
        actorId,
        actorRole,
        {
          // IMPORTANT:
          // client-supplied ID/status/applicant are intentionally ignored.
          requisitionType:
            body.requisitionType ||
            body.type,
          requisitionMode:
            body.requisitionMode ||
            body.itHrmsDetails?.requisitionMode,
          renewalReason:
            body.renewalReason ||
            body.itHrmsDetails?.renewalReason,
          remarks: body.remarks,
          itHrmsDetails:
            body.itHrmsDetails,
          labFacilities:
            body.labFacilities ||
            body.labAccessDetails ||
            [],
        },
      );

    return res.status(201).json({
      success: true,
      message: "Requisition created successfully.",
      id: result,
    });
  } catch (error: any) {
    console.error(
      "POST /api/requisitions ERROR:",
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
        "Unable to create requisition.",
    });
  }
}

export async function updateRequisition(
  req: Request & { user?: any },
  res: Response,
) {
  try {
    if (!isDbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database is unavailable.",
      });
    }

    const actorId =
      String(req.user?.userId || "").trim();

    const actorRole = normalizeRole(
      req.user?.role,
    );

    const requisitionId =
      String(req.params.id || "").trim();

    if (!actorId || !actorRole) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user is required.",
      });
    }

    if (!requisitionId) {
      return res.status(400).json({
        success: false,
        message: "Requisition ID is required.",
      });
    }

    const updated =
      await updateExistingRequisition(
        requisitionId,
        actorId,
        actorRole,
        req.body || {},
      );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message:
          "Requisition not found or no fields changed.",
      });
    }

    return res.json({
      success: true,
      message: "Requisition updated successfully.",
      id: requisitionId,
    });
  } catch (error: any) {
    console.error(
      "PUT /api/requisitions/:id ERROR:",
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
        "Unable to update requisition.",
    });
  }
}
