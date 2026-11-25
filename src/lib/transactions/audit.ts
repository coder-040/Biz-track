"use client";

import { supabase } from "@/lib/supabase/client";
import type { AuditEntry } from "@/lib/transactions/types";

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
