import type { SupabaseClient } from "@supabase/supabase-js";

type AuditEntry = {
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, unknown>;
};

export async function audit(supabase: SupabaseClient, entry: AuditEntry) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: entry.actorId,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    changes: entry.changes ?? {},
  });

  if (error) console.error("Audit log failed:", error);
}
