import { db } from "../db/connection";

export interface CreateRequisitionInput {
  id: string;
  applicantId: string;
  requisitionType: "IT_HRMS" | "LAB_FACILITY" | "COMBINED";
  status?: string;
  requisitionMode?: "new" | "renewal";
  renewalReason?: string | null;
  remarks?: string | null;
}

export interface ITHrmsDetailsInput {
  requestEmail?: boolean;
  requestedEmailPrefix?: string | null;
  requestedEmailGroups?: string[] | null;
  requestInternet?: boolean;
  deviceType?: string | null;
  macAddress?: string | null;
  requestHrmsPms?: boolean;
  requestBiometric?: boolean;
  provisionedEmail?: string | null;
  provisionedMac?: string | null;
  provisionedHrmsId?: string | null;
  provisionedBiometricId?: string | null;
}

export interface LabFacilityInput {
  facilityId: string;
  facilityName: string;
  purposeEquipment?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  hasBiometricId?: boolean;
  biometricIdNumber?: string | null;
  assignedLabPassId?: string | null;
  nodalApprovalStatus?: "pending" | "approved" | "rejected";
  remarks?: string | null;
  reviewedById?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  nodalOfficerName?: string | null;
  actionDate?: string | null;
}

function parseJson<T = any>(
  value: unknown,
  fallback: T,
): T {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toBoolean(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
}

function mapAuditAction(actionType: string) {
  switch (actionType) {
    case "SUBMIT":
      return "submit";

    case "PI_APPROVE":
      return "pi_approve";

    case "PI_REJECT":
      return "pi_reject";

    case "LAB_APPROVE":
      return "lab_approve";

    case "LAB_REJECT":
      return "lab_reject";

    case "SECTION_HEAD_APPROVE":
      return "section_head_authorize";

    case "SECTION_HEAD_REJECT":
      return "reject";

    case "TECH_PROVISION":
      return "tech_provision";

    case "REJECT":
      return "reject";

    case "OVERRIDE":
      return "deactivate";

    default:
      return "reject";
  }
}

function mapWorkflowHistory(rows: any[]) {
  return (rows || []).map((row: any) => ({
    id: `hist-${row.id}`,
    actorRole: row.actor_role,
    actorName: row.actor_name,
    actionType: mapAuditAction(
      String(row.action_type || ""),
    ),
    comments: row.remarks || undefined,
    timestamp: row.created_at,
    digitalSignature:
      row.actor_name || undefined,
  }));
}

function mapApplicant(row: any) {
  if (!row) {
    return undefined;
  }

  return {
    salutation: row.salutation || "Dr.",
    applicantName:
      row.applicant_name ||
      row.user_full_name ||
      "",
    gender: row.gender || "",
    dateOfBirth: row.date_of_birth
      ? String(row.date_of_birth).slice(0, 10)
      : "",
    bloodGroup: row.blood_group || "",
    mobileNo:
      row.mobile_no ||
      row.user_phone ||
      "",
    personalEmail:
      row.personal_email ||
      row.user_email ||
      "",
    address: row.address || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    pincode: row.pincode || undefined,
    bankName: row.bank_name || undefined,
    ifscCode: row.ifsc_code || undefined,
    accountNo: row.account_no || undefined,
    accountNoBank: row.account_no
      ? String(row.account_no)
      : "",
    panNo: row.pan_no || "",
    designation: row.designation || "",
    dateOfJoining: row.date_of_joining
      ? String(row.date_of_joining).slice(0, 10)
      : "",
    validUpTo: row.valid_up_to
      ? String(row.valid_up_to).slice(0, 10)
      : "",
    departmentCellProject:
      row.department_cell_project || "",
    supervisingOfficerName:
      row.supervising_officer_name || "",
    officeOrderFileName:
      row.office_order_file_name ||
      undefined,
    biometricId:
      row.biometric_id || undefined,
  };
}

function mapITDetails(row: any) {
  if (!row) {
    return undefined;
  }

  return {
    requestEmail: toBoolean(row.request_email),
    requestedEmailPrefix:
      row.requested_email_prefix ||
      undefined,
    requestedEmailGroups: parseJson<string[]>(
      row.requested_email_groups,
      [],
    ),
    requestInternet:
      toBoolean(row.request_internet),
    deviceType:
      row.device_type || undefined,
    macAddress:
      row.mac_address || undefined,
    requestHrmsPms:
      toBoolean(row.request_hrms_pms),
    requestBiometric:
      toBoolean(row.request_biometric),

    // Non-secret provisioning identifiers.
    assignedWiiEmail:
      row.provisioned_email ||
      undefined,
    verifiedMacAddress:
      row.provisioned_mac ||
      undefined,
    assignedHrmsEmpCode:
      row.provisioned_hrms_id ||
      undefined,
    assignedBiometricId:
      row.provisioned_biometric_id ||
      undefined,
  };
}

function mapLabDetails(rows: any[]) {
  return (rows || []).map((row: any) => ({
    labId: row.facility_id,
    labName: row.facility_name,
    selected: true,
    purposeEquipment:
      row.purpose_equipment || "",
    fromDate: row.from_date
      ? String(row.from_date).slice(0, 10)
      : "",
    toDate: row.to_date
      ? String(row.to_date).slice(0, 10)
      : "",
    hasBiometricId:
      toBoolean(row.has_biometric_id),
    biometricIdNumber:
      row.biometric_id_number ||
      undefined,
    assignedLabPassId:
      row.assigned_lab_pass_id ||
      undefined,
    nodalApprovalStatus:
      row.nodal_approval_status || "pending",
    nodalComments:
      row.remarks || undefined,
    nodalOfficerName:
      row.nodal_officer_name ||
      undefined,
    actionDate:
      row.action_date
        ? String(row.action_date).slice(0, 10)
        : undefined,
  }));
}

function mapWorkflowState(row: any) {
  if (!row) {
    return {
      piApproval: undefined,
      sectionHeadApproval: undefined,
      itCellVerification: undefined,
    };
  }

  const piApproval =
    row.pi_status ||
    row.pi_officer_name ||
    row.pi_comments
      ? {
          status:
            row.pi_status || "pending",
          officerName:
            row.pi_officer_name || "",
          comments:
            row.pi_comments || undefined,
          timestamp:
            row.pi_timestamp ||
            undefined,
          signature:
            row.pi_signature ||
            undefined,
        }
      : undefined;

  const sectionHeadApproval =
    row.section_head_status ||
    row.section_head_officer_name ||
    row.section_head_comments
      ? {
          status:
            row.section_head_status ||
            "pending",
          officerName:
            row.section_head_officer_name ||
            "",
          comments:
            row.section_head_comments ||
            undefined,
          timestamp:
            row.section_head_timestamp ||
            undefined,
          signature:
            row.section_head_signature ||
            undefined,
        }
      : undefined;

  const hasTechnicalState =
    row.email_net_status ||
    row.email_net_officer_name ||
    row.hrms_status ||
    row.hrms_officer_name ||
    row.biometric_status ||
    row.biometric_officer_name;

  const itCellVerification =
    hasTechnicalState
      ? {
          emailNetOfficer:
            row.email_net_status ||
            row.email_net_officer_name
              ? {
                  officerName:
                    row.email_net_officer_name ||
                    "",
                  status:
                    row.email_net_status ||
                    "pending",
                  comments:
                    row.email_net_comments ||
                    undefined,
                  timestamp:
                    row.email_net_timestamp ||
                    undefined,
                }
              : undefined,

          hrmsOfficer:
            row.hrms_status ||
            row.hrms_officer_name
              ? {
                  officerName:
                    row.hrms_officer_name ||
                    "",
                  status:
                    row.hrms_status ||
                    "pending",
                  comments:
                    row.hrms_comments ||
                    undefined,
                  timestamp:
                    row.hrms_timestamp ||
                    undefined,
                }
              : undefined,

          biometricOfficer:
            row.biometric_status ||
            row.biometric_officer_name
              ? {
                  officerName:
                    row.biometric_officer_name ||
                    "",
                  status:
                    row.biometric_status ||
                    "pending",
                  comments:
                    row.biometric_comments ||
                    undefined,
                  timestamp:
                    row.biometric_timestamp ||
                    undefined,
                }
              : undefined,
        }
      : undefined;

  return {
    piApproval,
    sectionHeadApproval,
    itCellVerification,
  };
}

// ------------------------------------------------------------
// Generate server-side requisition ID.
// ------------------------------------------------------------
export async function generateNextRequisitionId() {
  const year = new Date().getFullYear();

  const [rows]: any = await db.query(
    `
    SELECT id
    FROM requisitions
    WHERE id LIKE ?
    ORDER BY id DESC
    `,
    [`WII/${year}/%`],
  );

  let maxSequence = 100;

  for (const row of rows || []) {
    const match = String(row.id || "").match(
      new RegExp(
        `^WII/${year}/(\\d+)$`,
        "i",
      ),
    );

    if (match) {
      const value = Number(match[1]);

      if (
        Number.isFinite(value) &&
        value > maxSequence
      ) {
        maxSequence = value;
      }
    }
  }

  return `WII/${year}/${String(
    maxSequence + 1,
  ).padStart(4, "0")}`;
}

// ------------------------------------------------------------
// Get all requisitions.
// Raw applicant_id/status fields are preserved for
// authorization decisions.
// ------------------------------------------------------------
export async function getAllRequisitions() {
  const [rows]: any = await db.query(
    `
    SELECT
      r.id,
      r.applicant_id,
      r.requisition_type,
      r.status,
      r.requisition_mode,
      r.renewal_reason,
      r.remarks,
      r.submitted_at,
      r.updated_at,

      u.full_name AS user_full_name,
      u.email AS user_email,
      u.phone AS user_phone,
      u.intercom_extension,

      p.salutation,
      p.applicant_name,
      p.gender,
      p.date_of_birth,
      p.blood_group,
      p.mobile_no,
      p.personal_email,
      p.wii_official_email,
      p.address,
      p.city,
      p.state,
      p.pincode,
      p.designation,
      p.department_cell_project,
      p.supervising_officer_id,
      p.supervising_officer_name,
      p.date_of_joining,
      p.valid_up_to,
      p.pan_no,
      p.bank_name,
      p.account_no,
      p.ifsc_code,
      p.office_order_file_name,
      p.biometric_id

    FROM requisitions r

    INNER JOIN users u
      ON u.id = r.applicant_id

    LEFT JOIN applicant_profiles p
      ON p.user_id = r.applicant_id

    ORDER BY
      r.submitted_at DESC,
      r.id DESC
    `,
  );

  return rows || [];
}

// ------------------------------------------------------------
// Get one complete requisition.
// ------------------------------------------------------------
export async function getRequisitionById(
  requisitionId: string,
) {
  const [rows]: any = await db.query(
    `
    SELECT
      r.id,
      r.applicant_id,
      r.requisition_type,
      r.status,
      r.requisition_mode,
      r.renewal_reason,
      r.remarks,
      r.submitted_at,
      r.updated_at,

      u.full_name AS user_full_name,
      u.email AS user_email,
      u.phone AS user_phone,
      u.intercom_extension,

      p.salutation,
      p.applicant_name,
      p.gender,
      p.date_of_birth,
      p.blood_group,
      p.mobile_no,
      p.personal_email,
      p.wii_official_email,
      p.address,
      p.city,
      p.state,
      p.pincode,
      p.designation,
      p.department_cell_project,
      p.supervising_officer_id,
      p.supervising_officer_name,
      p.date_of_joining,
      p.valid_up_to,
      p.pan_no,
      p.bank_name,
      p.account_no,
      p.ifsc_code,
      p.office_order_file_name,
      p.biometric_id

    FROM requisitions r

    INNER JOIN users u
      ON u.id = r.applicant_id

    LEFT JOIN applicant_profiles p
      ON p.user_id = r.applicant_id

    WHERE r.id = ?

    LIMIT 1
    `,
    [requisitionId],
  );

  const base = rows?.[0];

  if (!base) {
    return null;
  }

  const [itRows]: any = await db.query(
    `
    SELECT
      id,
      requisition_id,
      request_email,
      requested_email_prefix,
      requested_email_groups,
      request_internet,
      device_type,
      mac_address,
      request_hrms_pms,
      request_biometric,
      provisioned_email,
      provisioned_mac,
      provisioned_hrms_id,
      provisioned_biometric_id,
      created_at
    FROM it_hrms_details
    WHERE requisition_id = ?
    LIMIT 1
    `,
    [requisitionId],
  );

  const [labRows]: any = await db.query(
    `
    SELECT
      id,
      requisition_id,
      facility_id,
      facility_name,
      purpose_equipment,
      from_date,
      to_date,
      has_biometric_id,
      biometric_id_number,
      assigned_lab_pass_id,
      nodal_approval_status,
      remarks,
      reviewed_by_id,
      reviewed_by,
      reviewed_at,
      nodal_officer_name,
      action_date,
      created_at
    FROM lab_facility_details
    WHERE requisition_id = ?
    ORDER BY id ASC
    `,
    [requisitionId],
  );

  const [workflowRows]: any =
    await db.query(
      `
      SELECT
        requisition_id,
        pi_status,
        pi_officer_id,
        pi_officer_name,
        pi_comments,
        pi_timestamp,
        pi_signature,
        section_head_status,
        section_head_officer_id,
        section_head_officer_name,
        section_head_comments,
        section_head_timestamp,
        section_head_signature,
        email_net_status,
        email_net_officer_id,
        email_net_officer_name,
        email_net_comments,
        email_net_timestamp,
        hrms_status,
        hrms_officer_id,
        hrms_officer_name,
        hrms_comments,
        hrms_timestamp,
        biometric_status,
        biometric_officer_id,
        biometric_officer_name,
        biometric_comments,
        biometric_timestamp
      FROM requisition_workflow_states
      WHERE requisition_id = ?
      LIMIT 1
      `,
      [requisitionId],
    );

  const [historyRows]: any =
    await db.query(
      `
      SELECT
        id,
        requisition_id,
        actor_id,
        actor_name,
        actor_role,
        action_type,
        stage_from,
        stage_to,
        remarks,
        ip_address,
        created_at
      FROM workflow_audit_logs
      WHERE requisition_id = ?
      ORDER BY created_at ASC, id ASC
      `,
      [requisitionId],
    );

  const workflowState =
    mapWorkflowState(
      workflowRows?.[0],
    );

  const result: any = {
    // Raw fields retained for backend authorization.
    id: base.id,
    applicant_id: base.applicant_id,
    requisition_type:
      base.requisition_type,
    status: base.status,
    requisition_mode:
      base.requisition_mode,
    renewal_reason:
      base.renewal_reason,
    remarks: base.remarks,

    // Frontend-compatible fields.
    type: base.requisition_type,
    applicant: mapApplicant(base),

    itHrmsDetails:
      mapITDetails(itRows?.[0]),

    labAccessDetails:
      mapLabDetails(labRows),

    piApproval:
      workflowState.piApproval,

    sectionHeadApproval:
      workflowState.sectionHeadApproval,

    itCellVerification:
      workflowState.itCellVerification,

    history:
      mapWorkflowHistory(historyRows),

    createdAt:
      base.submitted_at,

    updatedAt:
      base.updated_at,

    requisitionMode:
      base.requisition_mode,

    renewalReason:
      base.renewal_reason,
  };

  return result;
}

// ------------------------------------------------------------
// Create requisition master row.
// ------------------------------------------------------------
export async function createRequisition(
  input: CreateRequisitionInput,
) {
  await db.query(
    `
    INSERT INTO requisitions (
      id,
      applicant_id,
      requisition_type,
      status,
      requisition_mode,
      renewal_reason,
      remarks
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.id,
      input.applicantId,
      input.requisitionType,
      input.status ||
        "submitted_pending_pi",
      input.requisitionMode || "new",
      input.renewalReason || null,
      input.remarks || null,
    ],
  );

  return input.id;
}

// ------------------------------------------------------------
// Initialize current workflow state.
// ------------------------------------------------------------
export async function initializeWorkflowState(
  requisitionId: string,
) {
  await db.query(
    `
    INSERT INTO requisition_workflow_states (
      requisition_id
    )
    VALUES (?)
    ON DUPLICATE KEY UPDATE
      requisition_id = VALUES(requisition_id)
    `,
    [requisitionId],
  );
}

// ------------------------------------------------------------
// IT / HRMS upsert.
// Used for creation/full detail writes.
// ------------------------------------------------------------
export async function upsertITHrmsDetails(
  requisitionId: string,
  details: ITHrmsDetailsInput,
) {
  await db.query(
    `
    INSERT INTO it_hrms_details (
      requisition_id,
      request_email,
      requested_email_prefix,
      requested_email_groups,
      request_internet,
      device_type,
      mac_address,
      request_hrms_pms,
      request_biometric,
      provisioned_email,
      provisioned_mac,
      provisioned_hrms_id,
      provisioned_biometric_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    ON DUPLICATE KEY UPDATE
      request_email =
        VALUES(request_email),
      requested_email_prefix =
        VALUES(requested_email_prefix),
      requested_email_groups =
        VALUES(requested_email_groups),
      request_internet =
        VALUES(request_internet),
      device_type =
        VALUES(device_type),
      mac_address =
        VALUES(mac_address),
      request_hrms_pms =
        VALUES(request_hrms_pms),
      request_biometric =
        VALUES(request_biometric),
      provisioned_email =
        COALESCE(
          VALUES(provisioned_email),
          provisioned_email
        ),
      provisioned_mac =
        COALESCE(
          VALUES(provisioned_mac),
          provisioned_mac
        ),
      provisioned_hrms_id =
        COALESCE(
          VALUES(provisioned_hrms_id),
          provisioned_hrms_id
        ),
      provisioned_biometric_id =
        COALESCE(
          VALUES(provisioned_biometric_id),
          provisioned_biometric_id
        )
    `,
    [
      requisitionId,
      Boolean(details.requestEmail),
      details.requestedEmailPrefix ||
        null,
      details.requestedEmailGroups
        ? JSON.stringify(
            details.requestedEmailGroups,
          )
        : null,
      Boolean(details.requestInternet),
      details.deviceType || null,
      details.macAddress || null,
      Boolean(details.requestHrmsPms),
      Boolean(details.requestBiometric),
      details.provisionedEmail ||
        null,
      details.provisionedMac ||
        null,
      details.provisionedHrmsId ||
        null,
      details.provisionedBiometricId ||
        null,
    ],
  );
}

// ------------------------------------------------------------
// Update ONLY provisioning columns.
// ------------------------------------------------------------
export async function updateProvisioningFields(
  requisitionId: string,
  values: {
    provisionedEmail?: string | null;
    provisionedMac?: string | null;
    provisionedHrmsId?: string | null;
    provisionedBiometricId?: string | null;
  },
) {
  const fields: string[] = [];
  const params: any[] = [];

  if (
    values.provisionedEmail !==
    undefined
  ) {
    fields.push(
      "provisioned_email = ?",
    );
    params.push(
      values.provisionedEmail,
    );
  }

  if (
    values.provisionedMac !==
    undefined
  ) {
    fields.push(
      "provisioned_mac = ?",
    );
    params.push(
      values.provisionedMac,
    );
  }

  if (
    values.provisionedHrmsId !==
    undefined
  ) {
    fields.push(
      "provisioned_hrms_id = ?",
    );
    params.push(
      values.provisionedHrmsId,
    );
  }

  if (
    values.provisionedBiometricId !==
    undefined
  ) {
    fields.push(
      "provisioned_biometric_id = ?",
    );
    params.push(
      values.provisionedBiometricId,
    );
  }

  if (fields.length === 0) {
    return false;
  }

  params.push(requisitionId);

  const [result]: any = await db.query(
    `
    UPDATE it_hrms_details
    SET ${fields.join(", ")}
    WHERE requisition_id = ?
    `,
    params,
  );

  return Boolean(
    result?.affectedRows,
  );
}

// ------------------------------------------------------------
// Replace all lab details for a requisition.
// ------------------------------------------------------------
export async function replaceLabFacilities(
  requisitionId: string,
  facilities: LabFacilityInput[],
) {
  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `
      DELETE FROM lab_facility_details
      WHERE requisition_id = ?
      `,
      [requisitionId],
    );

    for (const facility of facilities) {
      await connection.query(
        `
        INSERT INTO lab_facility_details (
          requisition_id,
          facility_id,
          facility_name,
          purpose_equipment,
          from_date,
          to_date,
          has_biometric_id,
          biometric_id_number,
          assigned_lab_pass_id,
          nodal_approval_status,
          remarks,
          reviewed_by_id,
          reviewed_by,
          reviewed_at,
          nodal_officer_name,
          action_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          requisitionId,
          facility.facilityId,
          facility.facilityName,
          facility.purposeEquipment ||
            null,
          facility.fromDate || null,
          facility.toDate || null,
          Boolean(
            facility.hasBiometricId,
          ),
          facility.biometricIdNumber ||
            null,
          facility.assignedLabPassId ||
            null,
          facility.nodalApprovalStatus ||
            "pending",
          facility.remarks || null,
          facility.reviewedById ||
            null,
          facility.reviewedBy || null,
          facility.reviewedAt || null,
          facility.nodalOfficerName ||
            null,
          facility.actionDate || null,
        ],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback()
      .catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

// ------------------------------------------------------------
// Selected lab facilities.
// ------------------------------------------------------------
export async function getSelectedLabFacilities(
  requisitionId: string,
) {
  const [rows]: any = await db.query(
    `
    SELECT
      id,
      requisition_id,
      facility_id,
      facility_name,
      purpose_equipment,
      from_date,
      to_date,
      has_biometric_id,
      biometric_id_number,
      assigned_lab_pass_id,
      nodal_approval_status,
      remarks,
      reviewed_by_id,
      reviewed_by,
      reviewed_at,
      nodal_officer_name,
      action_date,
      created_at
    FROM lab_facility_details
    WHERE requisition_id = ?
    ORDER BY id ASC
    `,
    [requisitionId],
  );

  return rows || [];
}

// ------------------------------------------------------------
// Update master requisition fields.
// ------------------------------------------------------------
export async function updateRequisitionMaster(
  requisitionId: string,
  values: {
    status?: string;
    requisitionMode?:
      | "new"
      | "renewal";
    renewalReason?: string | null;
    remarks?: string | null;
  },
) {
  const fields: string[] = [];
  const params: any[] = [];

  if (values.status !== undefined) {
    fields.push("status = ?");
    params.push(values.status);
  }

  if (
    values.requisitionMode !==
    undefined
  ) {
    fields.push(
      "requisition_mode = ?",
    );
    params.push(
      values.requisitionMode,
    );
  }

  if (
    values.renewalReason !==
    undefined
  ) {
    fields.push(
      "renewal_reason = ?",
    );
    params.push(
      values.renewalReason,
    );
  }

  if (values.remarks !== undefined) {
    fields.push("remarks = ?");
    params.push(values.remarks);
  }

  if (fields.length === 0) {
    return false;
  }

  params.push(requisitionId);

  const [result]: any = await db.query(
    `
    UPDATE requisitions
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    params,
  );

  return Boolean(
    result?.affectedRows,
  );
}

// ------------------------------------------------------------
// Update current workflow state.
// ------------------------------------------------------------
export async function updateWorkflowState(
  requisitionId: string,
  values: Record<string, any>,
) {
  const allowedColumns = new Set([
    "pi_status",
    "pi_officer_id",
    "pi_officer_name",
    "pi_comments",
    "pi_timestamp",
    "pi_signature",

    "section_head_status",
    "section_head_officer_id",
    "section_head_officer_name",
    "section_head_comments",
    "section_head_timestamp",
    "section_head_signature",

    "email_net_status",
    "email_net_officer_id",
    "email_net_officer_name",
    "email_net_comments",
    "email_net_timestamp",

    "hrms_status",
    "hrms_officer_id",
    "hrms_officer_name",
    "hrms_comments",
    "hrms_timestamp",

    "biometric_status",
    "biometric_officer_id",
    "biometric_officer_name",
    "biometric_comments",
    "biometric_timestamp",
  ]);

  const fields: string[] = [];
  const params: any[] = [];

  for (const [
    key,
    value,
  ] of Object.entries(values)) {
    if (!allowedColumns.has(key)) {
      continue;
    }

    fields.push(`${key} = ?`);
    params.push(
      value === undefined
        ? null
        : value,
    );
  }

  if (fields.length === 0) {
    return false;
  }

  params.push(requisitionId);

  const [result]: any = await db.query(
    `
    UPDATE requisition_workflow_states
    SET ${fields.join(", ")}
    WHERE requisition_id = ?
    `,
    params,
  );

  return Boolean(
    result?.affectedRows,
  );
}

