"use client"

import { InventoryErrorState } from "@/components/inventory/inventory-error-state"

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <InventoryErrorState error={error} reset={reset} />
}
