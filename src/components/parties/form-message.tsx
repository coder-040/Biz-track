import type { ActionState } from "@/lib/action-state";

interface FormMessageProps {
  state: ActionState;
}

export function FormMessage({ state }: FormMessageProps) {
  if (state.status === "idle" || !state.message) return null;

  const success = state.status === "success";

  return (
    <p
      role={success ? "status" : "alert"}
      className={
        success
          ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200"
          : "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      }
    >
      {state.message}
    </p>
  );
}
