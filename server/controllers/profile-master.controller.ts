import type { Request, Response } from "express";

import {
  listEmploymentTypes,
  listOrgUnits,
  listBanks,
  listBatchSeries,
  listBatches,
  listProfileOfficers,
} from "../services/profile-master.service";

function handleError(
  res: Response,
  error: unknown,
  defaultMessage: string,
) {
  const message =
    error instanceof Error
      ? error.message
      : defaultMessage;

  return res.status(400).json({
    success: false,
    message,
  });
}

/*
 * GET /api/profile/masters/employment-types
 *
 * Authoritative employment type list.
 */
export async function getEmploymentTypes(
  _req: Request,
  res: Response,
) {
  try {
    const data =
      await listEmploymentTypes();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET employment types ERROR:",
      error,
    );

    return handleError(
      res,
      error,
      "Unable to fetch employment types.",
    );
  }
}

/*
 * GET /api/profile/masters/org-units
 *
 * Optional:
 * ?type=department
 * ?type=cell
 * ?type=project
 *
 * Multiple values are also supported:
 * ?type=department&type=cell
 */
export async function getOrgUnits(
  req: Request,
  res: Response,
) {
  try {
    const rawType = req.query.type;

    let requestedTypes:
      | string[]
      | undefined;

    if (rawType !== undefined) {
      requestedTypes = Array.isArray(rawType)
        ? rawType.map(String)
        : [String(rawType)];
    }

    const data =
      await listOrgUnits(
        requestedTypes,
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET organization units ERROR:",
      error,
    );

    return handleError(
      res,
      error,
      "Unable to fetch organization units.",
    );
  }
}

/*
 * GET /api/profile/masters/banks
 */
export async function getBanks(
  _req: Request,
  res: Response,
) {
  try {
    const data =
      await listBanks();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET banks ERROR:",
      error,
    );

    return handleError(
      res,
      error,
      "Unable to fetch banks.",
    );
  }
}

/*
 * GET /api/profile/masters/batch-series
 *
 * Optional:
 * ?seriesType=msc
 * ?seriesType=diploma_trainee
 */
export async function getBatchSeries(
  req: Request,
  res: Response,
) {
  try {
    const seriesType =
      req.query.seriesType;

    const data =
      await listBatchSeries(
        seriesType,
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET batch series ERROR:",
      error,
    );

    return handleError(
      res,
      error,
      "Unable to fetch batch series.",
    );
  }
}

/*
 * GET /api/profile/masters/batches
 *
 * Optional:
 * ?seriesType=msc
 * ?seriesType=diploma_trainee
 */
export async function getBatches(
  req: Request,
  res: Response,
) {
  try {
    const seriesType =
      req.query.seriesType;

    const data =
      await listBatches(
        seriesType,
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET batches ERROR:",
      error,
    );

    return handleError(
      res,
      error,
      "Unable to fetch batches.",
    );
  }
}

/*
 * GET /api/profile/masters/officers
 *
 * Returns active users with their DB-backed roles.
 * The frontend does not decide who is an officer/PI.
 */
export async function getProfileOfficers(
  _req: Request,
  res: Response,
) {
  try {
    const data =
      await listProfileOfficers();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET profile officers ERROR:",
      error,
    );

    return handleError(
      res,
      error,
      "Unable to fetch profile officers.",
    );
  }
}
