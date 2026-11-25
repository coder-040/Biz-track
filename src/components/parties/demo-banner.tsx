import { DatabaseIcon } from "lucide-react";

export function DemoBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
    >
      <DatabaseIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        Demo data — connect Supabase to persist changes. Data resets when the
        server restarts.
      </p>
    </div>
  );
}
