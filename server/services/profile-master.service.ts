import {
  getBanks,
  getBatches,
  getEmploymentTypes,
  getOrgUnits,
  getProfileOfficers,
  getBatchSeries,
} from "../repositories/profile-master.repository";

const ALLOWED_ORG_UNIT_TYPES = new Set([
  "department",
  "cell",
  "project",
]);

const ALLOWED_BATCH_SERIES = new Set([
  "msc",
  "diploma_trainee",
]);

export async function listEmploymentTypes() {
  return getEmploymentTypes();
}

export async function listOrgUnits(
  requestedTypes?: unknown,
) {
  let types: string[] | undefined;

  if (requestedTypes !== undefined) {
    if (!Array.isArray(requestedTypes)) {
      throw new Error(
        "Invalid organization unit type selection.",
      );
    }

    types = requestedTypes.map((value) =>
      String(value),
    );

    for (const type of types) {
      if (!ALLOWED_ORG_UNIT_TYPES.has(type)) {
        throw new Error(
          "Invalid organization unit type.",
        );
      }
    }
  }

  return getOrgUnits(types);
}

export async function listBanks() {
  return getBanks();
}

export async function listBatchSeries(
  requestedSeriesType?: unknown,
) {
  let seriesType: string | undefined;

  if (
    requestedSeriesType !== undefined &&
    requestedSeriesType !== null &&
    String(requestedSeriesType).trim() !== ""
  ) {
    seriesType =
      String(requestedSeriesType).trim();

    if (
      !ALLOWED_BATCH_SERIES.has(seriesType)
    ) {
      throw new Error(
        "Invalid batch series.",
      );
    }
  }

  return getBatchSeries(seriesType);
}

export async function listBatches(
  requestedSeriesType?: unknown,
) {
  let seriesType: string | undefined;

  if (
    requestedSeriesType !== undefined &&
    requestedSeriesType !== null &&
    String(requestedSeriesType).trim() !== ""
  ) {
    seriesType =
      String(requestedSeriesType).trim();

    if (
      !ALLOWED_BATCH_SERIES.has(seriesType)
    ) {
      throw new Error(
        "Invalid batch series.",
      );
    }
  }

  return getBatches(seriesType);
}

export async function listProfileOfficers() {
  return getProfileOfficers();
}
