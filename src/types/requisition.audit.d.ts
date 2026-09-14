import "./requisition";

declare module "./requisition" {
  export type SecurityAuditActionType =
    | "PROFILE_UPDATE"
    | "OFFICE_ORDER_UPLOAD"
    | "REQUISITION_SUBMIT"
    | "PI_APPROVAL"
    | "PI_REJECTION"
    | "IT_EMAIL_PROVISION"
    | "IT_WIFI_BINDING"
    | "HRMS_PORTAL_GRANT"
    | "BIOMETRIC_ENROLL"
    | "LAB_SLOT_APPROVAL"
    | "SECTION_HEAD_AUTHORIZATION"
    | "ROLE_CHANGE"
    | "USER_STATUS_TOGGLE"
    | "USER_CREATE"
    | "FACILITY_MASTER_EDIT"
    | "SERVICE_MASTER_EDIT"
    | "SYSTEM_CONFIG_CHANGE"
    | "LOGIN_SUCCESS"
    | "PASSWORD_RESET";

  export interface SecurityAuditLogEntry {
    id: string;
    timestamp: string;
    actorName: string;
    actorEmail: string;
    actorRole: UserRole;
    actorRoleLabel?: string;
    actionType: SecurityAuditActionType;
    module: string;
    summary: string;
    details?: {
      previousValue?: string;
      newValue?: string;
      targetEntity?: string;
      ipAddress?: string;
      digitalSignature?: string;
      comments?: string;
    };
    ipAddress: string;
    status: "SUCCESS" | "WARNING" | "FAILED";
  }
}
