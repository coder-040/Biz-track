"use client";

import { supabase } from "@/lib/supabase/client";

export type AuditEntityType = "transaction" | "party";
export type AuditAction = "insert" | "update" | "delete";

export interface AuditEntry {
  businessId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actorId: string;
  actorName: string | null;
  changes: { before: unknown | null; after: unknown | null };
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    business_id: entry.businessId,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    actor_id: entry.actorId,
    actor_name: entry.actorName,
    changes: entry.changes,
  });

  if (error) throw new Error(error.message);
}
