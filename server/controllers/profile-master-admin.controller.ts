import type { Request, Response } from "express";

import {
  listAdminOrgUnits,
  listAdminBanks,
  listAdminBatches,
  addOrgUnit,
  editOrgUnit,
  changeOrgUnitStatus,
  addBank,
  editBank,
  changeBankStatus,
  addBatch,
  editBatch,
  changeBatchStatus,
} from "../services/profile-master-admin.service";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getId(req: Request): string | undefined {
  return req.params.id;
}

/* =========================
   ADMIN MASTER LISTS
   ========================= */

/**
 * Returns all organization units, including inactive records.
 *
 * This endpoint is administrator-only at the route layer.
 * It intentionally differs from the normal profile master GET API,
 * which returns active records only.
 */
export async function getAdminOrgUnits(_req: Request, res: Response) {
  try {
    const data = await listAdminOrgUnits();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET ADMIN profile org units ERROR:", error);

    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Unable to load organization units."),
    });
  }
}

/**
 * Returns all banks, including inactive records.
 */
export async function getAdminBanks(_req: Request, res: Response) {
  try {
    const data = await listAdminBanks();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET ADMIN profile banks ERROR:", error);

    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Unable to load banks."),
    });
  }
}

/**
 * Returns all batches, including inactive records.
 */
export async function getAdminBatches(_req: Request, res: Response) {
  try {
    const data = await listAdminBatches();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET ADMIN profile batches ERROR:", error);

    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Unable to load batches."),
    });
  }
}

/* =========================
   ORGANIZATION UNITS
   ========================= */

export async function createOrgUnit(req: Request, res: Response) {
  try {
    const data = await addOrgUnit(req.body);

    return res.status(201).json({
      success: true,
      message: "Organization unit created successfully.",
      data,
    });
  } catch (error) {
    console.error("CREATE profile org unit ERROR:", error);

    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, "Unable to create organization unit."),
    });
  }
}

export async function updateOrgUnit(req: Request, res: Response) {
  try {
    const data = await editOrgUnit(getId(req), req.body);

    return res.json({
      success: true,
      message: "Organization unit updated successfully.",
      data,
    });
  } catch (error) {
    console.error("UPDATE profile org unit ERROR:", error);

    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, "Unable to update organization unit."),
    });
  }
}

export async function updateOrgUnitStatus(req: Request, res: Response) {
  try {
    const data = await changeOrgUnitStatus(getId(req), req.body?.status);

    return res.json({
      success: true,
      message: "Organization unit status updated successfully.",
      data,
    });
  } catch (error) {
    console.error("UPDATE profile org unit status ERROR:", error);

    return res.status(400).json({
      success: false,
      message: getErrorMessage(
        error,
        "Unable to update organization unit status.",
      ),
    });
  }
}

/* =========================
   BANKS
   ========================= */

export async function createBank(req: Request, res: Response) {
  try {
    const data = await addBank(req.body);

    return res.status(201).json({
      success: true,
      message: "Bank created successfully.",
      data,
    });
  } catch (error) {
    console.error("CREATE profile bank ERROR:", error);

    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, "Unable to create bank."),
    });
  }
}

export async function updateBank(req: Request, res: Response) {
  try {
    const data = await editBank(getId(req), req.body);

    return res.json({
      success: true,
      message: "Bank updated successfully.",
      data,
    });
  } catch (error) {
    console.error("UPDATE profile bank ERROR:", error);

    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, "Unable to update bank."),
    });
  }
}

export async function updateBankStatus(req: Request, res: Response) {
  try {
    const data = await changeBankStatus(getId(req), req.body?.status);

    return res.json({
      success: true,
      message: "Bank status updated successfully.",
      data,
    });
  } catch (error) {
    console.error("UPDATE profile bank status ERROR:", error);

    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, "Unable to update bank status."),
    });
  }
}

/* =========================
   BATCHES
   ========================= */

export async function createBatch(req: Request, res: Response) {
  try {
    const data = await addBatch(req.body);

    return res.status(201).json({
      success: true,
      message: "Batch created successfully.",
      data,
    });
  } catch (error) {
    console.error("CREATE profile batch ERROR:", error);

    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, "Unable to create batch."),
    });
  }
}

export async function updateBatch(req: Request, res: Response) {
  try {
    const data = await editBatch(getId(req), req.body);

    return res.json({
      success: true,
      message: "Batch updated successfully.",
      data,
    });
  } catch (error) {
    console.error("UPDATE profile batch ERROR:", error);

    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, "Unable to update batch."),
    });
  }
}

export async function updateBatchStatus(req: Request, res: Response) {
  try {
    const data = await changeBatchStatus(getId(req), req.body?.status);

    return res.json({
      success: true,
      message: "Batch status updated successfully.",
      data,
    });
  } catch (error) {
    console.error("UPDATE profile batch status ERROR:", error);

    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, "Unable to update batch status."),
    });
  }
}
