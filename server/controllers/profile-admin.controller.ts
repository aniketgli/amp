import type {
  Request,
  Response,
} from "express";

import {
  updateUserProfileAsAdmin,
} from "../services/profile-admin.service";

/* ============================================================
   HELPERS
   ============================================================ */

function getAuthenticatedUserId(
  req: Request,
): number | null {
  const userId =
    (req as any).user?.userId;

  if (
    userId === undefined ||
    userId === null ||
    userId === ""
  ) {
    return null;
  }

  const numericUserId =
    Number(userId);

  if (
    !Number.isSafeInteger(
      numericUserId,
    ) ||
    numericUserId <= 0
  ) {
    return null;
  }

  return numericUserId;
}

function getTargetUserId(
  req: Request,
): number | null {
  const rawUserId =
    req.params.userId;

  if (!rawUserId) {
    return null;
  }

  const numericUserId =
    Number(rawUserId);

  if (
    !Number.isSafeInteger(
      numericUserId,
    ) ||
    numericUserId <= 0
  ) {
    return null;
  }

  return numericUserId;
}

function getRequestBody(
  req: Request,
): Record<string, unknown> | null {
  const body =
    req.body;

  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return null;
  }

  return body as Record<
    string,
    unknown
  >;
}

function getClientIp(
  req: Request,
): string | null {
  /*
   * req.ip is the canonical application-level
   * client IP after Express trust-proxy handling.
   */
  return req.ip || null;
}

function getUserAgent(
  req: Request,
): string | null {
  const userAgent =
    req.get("user-agent");

  if (!userAgent) {
    return null;
  }

  return userAgent.slice(0, 500);
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to update user profile.";
}

/* ============================================================
   ADMIN PROFILE UPDATE
   ============================================================ */

export async function updateUserProfileAsAdminController(
  req: Request,
  res: Response,
) {
  try {
    /*
     * Actor is ALWAYS obtained from the authenticated
     * server-side session.
     */
    const changedByUserId =
      getAuthenticatedUserId(req);

    if (!changedByUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated administrator could not be identified.",
      });
    }

    /*
     * Target user comes only from the URL parameter.
     */
    const targetUserId =
      getTargetUserId(req);

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid target User ID.",
      });
    }

    const body =
      getRequestBody(req);

    if (!body) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid profile data.",
      });
    }

    /*
     * IMPORTANT:
     *
     * No changedByUserId / actor / role information
     * is accepted from the request body.
     *
     * Authorization is handled by the route middleware.
     */
    const profile =
      await updateUserProfileAsAdmin(
        targetUserId,
        changedByUserId,
        body,
        {
          ipAddress:
            getClientIp(req),

          userAgent:
            getUserAgent(req),
        },
      );

    return res.json({
      success: true,
      message:
        "User profile updated successfully.",
      profile,
    });
  } catch (error) {
    console.error(
      "ADMIN PROFILE UPDATE ERROR:",
      error,
    );

    return res.status(400).json({
      success: false,
      message:
        getErrorMessage(error),
    });
  }
}
