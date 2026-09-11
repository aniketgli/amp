import type { PoolConnection } from "mysql2/promise";

import { db } from "../db/connection";

import {
  getUserById,
  updateUserIdentityWithConnection,
} from "../repositories/user.repository";

import {
  getProfileByUserIdWithConnection,
  upsertProfileWithConnection,
  type ApplicantProfileRecord,
} from "../repositories/profile.repository";

import { recordProfileChangeWithConnection } from "../repositories/profile-history.repository";

/* ============================================================
   VALIDATION
   ============================================================ */

function requireString(
  value: unknown,
  fieldName: string,
): string {
  const valueClean =
    value === undefined ||
    value === null
      ? ""
      : String(value).trim();

  if (!valueClean) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return valueClean;
}

function validateEmail(
  value: unknown,
): string {
  const email =
    requireString(
      value,
      "Email",
    ).toLowerCase();

  if (
    email.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    throw new Error(
      "Enter a valid email address.",
    );
  }

  return email;
}

function validateMobile(
  value: unknown,
): string {
  const mobile =
    requireString(
      value,
      "Mobile Number",
    );

  if (
    !/^[0-9]{10,15}$/.test(
      mobile,
    )
  ) {
    throw new Error(
      "Enter a valid mobile number.",
    );
  }

  return mobile;
}

function validateUserId(
  value: unknown,
): number {
  const userId = Number(value);

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0
  ) {
    throw new Error(
      "Invalid User ID.",
    );
  }

  return userId;
}

/* ============================================================
   DUPLICATE IDENTITY VALIDATION
   ============================================================ */

async function validateUniqueIdentity(
  connection: PoolConnection,
  userId: number,
  email: string,
  phone: string,
): Promise<void> {
  const [rows]: any =
    await connection.query(
      `
        SELECT
          id,
          email,
          phone
        FROM users
        WHERE
          (LOWER(email) = LOWER(?) OR phone = ?)
          AND id <> ?
        LIMIT 1
      `,
      [
        email,
        phone,
        userId,
      ],
    );

  if (rows?.length) {
    const existing =
      rows[0];

    if (
      String(
        existing.email || "",
      ).toLowerCase() ===
      email.toLowerCase()
    ) {
      throw new Error(
        "This email address is already assigned to another user.",
      );
    }

    if (
      String(
        existing.phone || "",
      ) === phone
    ) {
      throw new Error(
        "This mobile number is already assigned to another user.",
      );
    }

    throw new Error(
      "Email or mobile number is already assigned to another user.",
    );
  }
}

/* ============================================================
   AUDIT SANITIZATION
   ============================================================ */

function sanitizeIdentityForAudit(
  identity: {
    fullName: string;
    email: string;
    phone: string;
  },
) {
  return {
    fullName: identity.fullName,
    email: maskEmail(
      identity.email,
    ),
    phone: maskPhone(
      identity.phone,
    ),
  };
}

function maskEmail(
  value: string,
): string {
  const atIndex =
    value.indexOf("@");

  if (atIndex <= 0) {
    return "***";
  }

  const local =
    value.slice(0, atIndex);

  const domain =
    value.slice(atIndex);

  if (local.length <= 2) {
    return `***${domain}`;
  }

  return `${local.slice(0, 2)}***${domain}`;
}

function maskPhone(
  value: string,
): string {
  if (value.length <= 4) {
    return "****";
  }

  return `******${value.slice(-4)}`;
}

/* ============================================================
   PROFILE AUDIT
   ============================================================ */

const PROFILE_AUDIT_FIELDS = [
  "profilePhotoPath",
  "salutation",
  "applicantName",
  "employmentType",
  "gender",
  "dateOfBirth",
  "bloodGroup",
  "mobileNo",
  "personalEmail",
  "wiiOfficialEmail",
  "address",
  "city",
  "state",
  "pincode",
  "designation",
  "stream",
  "courseName",
  "departmentCellProject",
  "supervisingOfficerId",
  "supervisingOfficerName",
  "departmentId",
  "projectId",
  "reportingOfficerId",
  "reportingManagerId",
  "piUserId",
  "batchId",
  "dateOfJoining",
  "validUpTo",
  "panNo",
  "bankName",
  "accountNo",
  "ifscCode",
  "officeOrderFileName",
  "biometricId",
] as const;

type ProfileAuditField =
  (typeof PROFILE_AUDIT_FIELDS)[number];

const SENSITIVE_PROFILE_FIELDS =
  new Set<ProfileAuditField>([
    "panNo",
    "accountNo",
    "ifscCode",
  ]);

function maskProfileAuditValue(
  field: ProfileAuditField,
  value: unknown,
): unknown {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const text =
    String(value);

  if (
    !SENSITIVE_PROFILE_FIELDS.has(
      field,
    )
  ) {
    return value;
  }

  if (field === "panNo") {
    return text.length >= 4
      ? `${text.slice(0, 2)}****${text.slice(-2)}`
      : "***";
  }

  if (field === "accountNo") {
    return text.length > 4
      ? `****${text.slice(-4)}`
      : "****";
  }

  if (field === "ifscCode") {
    return text.length > 4
      ? `${text.slice(0, 4)}****`
      : "****";
  }

  return "***";
}

function profileForAudit(
  profile: ApplicantProfileRecord,
): Record<string, unknown> {
  const result: Record<
    string,
    unknown
  > = {};

  for (
    const field of PROFILE_AUDIT_FIELDS
  ) {
    result[field] =
      maskProfileAuditValue(
        field,
        profile[field],
      );
  }

  return result;
}

function findChangedProfileFields(
  oldProfile:
    | ApplicantProfileRecord
    | null,
  newProfile:
    ApplicantProfileRecord,
): ProfileAuditField[] {
  const oldValues =
    oldProfile
      ? profileForAudit(
          oldProfile,
        )
      : {};

  const newValues =
    profileForAudit(
      newProfile,
    );

  return PROFILE_AUDIT_FIELDS.filter(
    (field) =>
      JSON.stringify(
        oldValues[field] ??
          null,
      ) !==
      JSON.stringify(
        newValues[field] ??
          null,
      ),
  );
}

/* ============================================================
   ADMIN IDENTITY AUDIT
   ============================================================ */

function findChangedIdentityFields(
  oldUser: any,
  newIdentity: {
    fullName: string;
    email: string;
    phone: string;
  },
): string[] {
  const changed: string[] = [];

  if (
    String(
      oldUser.full_name ||
      "",
    ).trim() !==
    newIdentity.fullName
  ) {
    changed.push(
      "fullName",
    );
  }

  if (
    String(
      oldUser.email ||
      "",
    ).trim().toLowerCase() !==
    newIdentity.email.toLowerCase()
  ) {
    changed.push(
      "email",
    );
  }

  if (
    String(
      oldUser.phone ||
      "",
    ).trim() !==
    newIdentity.phone
  ) {
    changed.push(
      "phone",
    );
  }

  return changed;
}

/* ============================================================
   ADMIN PROFILE UPDATE
   ============================================================ */

export async function updateUserProfileAsAdmin(
  targetUserIdInput: number | string,
  changedByUserIdInput: number | string,
  input: any,
  auditContext?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  const targetUserId =
    validateUserId(
      targetUserIdInput,
    );

  const changedByUserId =
    validateUserId(
      changedByUserIdInput,
    );

  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new Error(
      "Invalid profile data.",
    );
  }

  /*
   * The service receives the target user ID and
   * authenticated administrator ID separately.
   *
   * Neither value is accepted from request body.
   */

  const targetUser =
    await getUserById(
      targetUserId,
    );

  if (!targetUser) {
    throw new Error(
      "User not found.",
    );
  }

  const fullName =
    requireString(
      input.applicantName ??
        input.fullName,
      "Full Name",
    );

  const email =
    validateEmail(
      input.personalEmail ??
        input.email,
    );

  const phone =
    validateMobile(
      input.mobileNo ??
        input.phone,
    );

  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    /*
     * Re-read target user inside transaction.
     */
    const [users]: any =
      await connection.query(
        `
          SELECT
            id,
            full_name,
            email,
            phone,
            status
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [targetUserId],
      );

    const currentUser =
      users?.[0];

    if (!currentUser) {
      throw new Error(
        "User not found.",
      );
    }

    await validateUniqueIdentity(
      connection,
      targetUserId,
      email,
      phone,
    );

    const changedIdentityFields =
      findChangedIdentityFields(
        currentUser,
        {
          fullName,
          email,
          phone,
        },
      );

    /*
     * Update identity only when something changed.
     */
    if (
      changedIdentityFields.length > 0
    ) {
      await updateUserIdentityWithConnection(
        connection,
        targetUserId,
        {
          fullName,
          email,
          phone,
        },
      );
    }

    /*
     * Existing profile remains authoritative for all other
     * fields. If admin sends profile fields, use the same
     * profile service validation path in the dedicated admin
     * profile workflow later.
     *
     * For this step we intentionally restrict this service
     * to the three administrator-controlled identity fields.
     */

    const currentProfile =
      await getProfileByUserIdWithConnection(
        connection,
        targetUserId,
      );

    let savedProfile =
      currentProfile;

    const identityChanged =
      changedIdentityFields.length >
      0;

    /*
     * The applicant_profiles row must exist independently
     * of whether the current request changed identity data.
     *
     * A user can already contain the requested identity values
     * in `users` while still having no profile row.
     */
    if (!currentProfile) {
      const initialProfile: ApplicantProfileRecord =
        {
          userId:
            targetUserId,

          applicantName:
            fullName,

          mobileNo:
            phone,

          personalEmail:
            email,

          wiiOfficialEmail:
            email,
        };

      savedProfile =
        await upsertProfileWithConnection(
          connection,
          initialProfile,
        );
    } else if (identityChanged) {
      /*
       * Existing profile:
       * preserve every existing profile field and
       * synchronize administrator-controlled identity fields.
       */
      const updatedProfile: ApplicantProfileRecord =
        {
          ...currentProfile,

          applicantName:
            fullName,

          mobileNo:
            phone,

          personalEmail:
            email,

          /*
           * Do not overwrite an explicitly stored
           * official WII email.
           */
          wiiOfficialEmail:
            currentProfile.wiiOfficialEmail ||
            email,
        };

      savedProfile =
        await upsertProfileWithConnection(
          connection,
          updatedProfile,
        );
    }

    /*
     * ONE ADMIN_UPDATE audit entry records the entire
     * successful administrator operation.
     */
    if (
      changedIdentityFields.length >
        0
    ) {
      const oldIdentity = {
        fullName:
          String(
            currentUser.full_name ||
              "",
          ).trim(),
        email:
          String(
            currentUser.email ||
              "",
          ).trim().toLowerCase(),
        phone:
          String(
            currentUser.phone ||
              "",
          ).trim(),
      };

      const newIdentity = {
        fullName,
        email,
        phone,
      };

      await recordProfileChangeWithConnection(
        connection,
        {
          userId:
            targetUserId,

          changedByUserId,

          actionType:
            "ADMIN_UPDATE",

          changedFields:
            Object.fromEntries([
              ...changedIdentityFields.map(
                (field) => [
                  field,
                  true,
                ],
              ),
            ]),

          oldValues:
            sanitizeIdentityForAudit(
              oldIdentity,
            ),

          newValues:
            sanitizeIdentityForAudit(
              newIdentity,
            ),

          ipAddress:
            auditContext?.ipAddress ??
            null,

          userAgent:
            auditContext?.userAgent ??
            null,
        },
      );
    }

    await connection.commit();

    return (
      savedProfile ??
      (await getProfileByUserIdWithConnection(
        connection,
        targetUserId,
      ))
    );
  } catch (error) {
    await connection
      .rollback()
      .catch(() => {});

    throw error;
  } finally {
    connection.release();
  }
}


