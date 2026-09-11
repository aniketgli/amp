import type { PoolConnection } from "mysql2/promise";
import { db } from "../db/connection";

export interface ProfileHistoryEntry {
  userId: number;
  changedByUserId: number;
  actionType: "CREATE" | "UPDATE" | "ADMIN_UPDATE";
  changedFields: Record<string, unknown>;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/*
 * Sensitive profile values must never be stored in audit history
 * in plaintext.
 *
 * We record that the field changed, but redact the actual value.
 */
const SENSITIVE_FIELDS = new Set([
  "panNo",
  "accountNo",
  "password",
  "passwordHash",
  "activationToken",
  "sessionToken",
]);

function sanitizeAuditValue(
  field: string,
  value: unknown,
): unknown {
  if (SENSITIVE_FIELDS.has(field)) {
    return "[REDACTED]";
  }

  return value;
}

function sanitizeAuditObject(
  values: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!values) {
    return null;
  }

  const result: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(values)) {
    result[field] = sanitizeAuditValue(field, value);
  }

  return result;
}

async function insertProfileHistory(
  executor: typeof db | PoolConnection,
  entry: ProfileHistoryEntry,
): Promise<void> {
  const sanitizedOldValues =
    sanitizeAuditObject(entry.oldValues);

  const sanitizedNewValues =
    sanitizeAuditObject(entry.newValues);

  await executor.query(
    `
      INSERT INTO profile_change_history (
        user_id,
        changed_by_user_id,
        action_type,
        changed_fields,
        old_values,
        new_values,
        ip_address,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      entry.userId,
      entry.changedByUserId,
      entry.actionType,
      JSON.stringify(entry.changedFields),
      sanitizedOldValues
        ? JSON.stringify(sanitizedOldValues)
        : null,
      sanitizedNewValues
        ? JSON.stringify(sanitizedNewValues)
        : null,
      entry.ipAddress || null,
      entry.userAgent || null,
    ],
  );
}

/*
 * Normal non-transactional history writer.
 *
 * Kept for future independent audit events.
 */
export async function recordProfileChange(
  entry: ProfileHistoryEntry,
): Promise<void> {
  await insertProfileHistory(db, entry);
}

/*
 * Transaction-aware history writer.
 *
 * The caller owns BEGIN / COMMIT / ROLLBACK.
 * This guarantees that profile update and history
 * can participate in the same transaction.
 */
export async function recordProfileChangeWithConnection(
  connection: PoolConnection,
  entry: ProfileHistoryEntry,
): Promise<void> {
  await insertProfileHistory(connection, entry);
}
