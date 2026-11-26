"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";

interface FormMessageProps {
  state: ActionState;
}

export function FormMessage({ state }: FormMessageProps) {
  useEffect(() => {
    if (!state.message || state.status === "idle") return;
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state.message, state.status]);

  return null;
}
