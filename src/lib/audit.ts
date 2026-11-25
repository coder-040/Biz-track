"use client";

import { ACTOR_ID, ACTOR_NAME, BUSINESS_ID } from "@/lib/config";
import { supabase } from "@/lib/supabase/client";

export type AuditEntityType = "transaction" | "party";
export type AuditAction = "insert" | "update" | "delete";

export interface AuditEntry {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  changes: { before: unknown | null; after: unknown | null };
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    business_id: BUSINESS_ID,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    actor_id: ACTOR_ID,
    actor_name: ACTOR_NAME,
    changes: entry.changes,
  });

  if (error) throw new Error(error.message);
}
