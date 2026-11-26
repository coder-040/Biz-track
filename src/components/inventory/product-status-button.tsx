"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArchiveIcon, Loader2Icon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { archiveProduct, restoreProduct } from "@/app/inventory/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  initialActionState,
  type ActionState,
} from "@/lib/action-state"

interface ProductStatusButtonProps {
  productId: string
  isActive: boolean
  compact?: boolean
}

export function ProductStatusButton({
  productId,
  isActive,
  compact = false,
}: ProductStatusButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ActionState>(initialActionState)
  const [pending, startTransition] = useTransition()

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setState(initialActionState)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = isActive
        ? await archiveProduct(initialActionState, formData)
        : await restoreProduct(initialActionState, formData)

      setState(result)

      if (result.status !== "success") return

      toast.success(result.message)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant={
              compact ? "ghost" : isActive ? "destructive" : "outline"
            }
            size={compact ? "icon-sm" : "default"}
            className={compact ? "text-muted-foreground" : undefined}
            aria-label={isActive ? "Archive product" : "Restore product"}
            title={isActive ? "Archive product" : "Restore product"}
          />
        }
      >
        {isActive ? (
          <ArchiveIcon aria-hidden="true" />
        ) : (
          <RotateCcwIcon aria-hidden="true" />
        )}
        {compact ? (
          <span className="sr-only">
            {isActive ? "Archive product" : "Restore product"}
          </span>
        ) : isActive ? (
          "Archive product"
        ) : (
          "Restore product"
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isActive ? "Archive this product?" : "Restore this product?"}
          </DialogTitle>
          <DialogDescription>
            {isActive
              ? "It will disappear from active inventory and low-stock alerts, but its movement history is kept."
              : "It will return to active inventory and low-stock checks."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="product_id" value={productId} />
          {state.status === "error" ? (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isActive ? "destructive" : "default"}
              disabled={pending}
            >
              {pending ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : isActive ? (
                <ArchiveIcon aria-hidden="true" />
              ) : (
                <RotateCcwIcon aria-hidden="true" />
              )}
              {pending
                ? "Saving..."
                : isActive
                  ? "Archive product"
                  : "Restore product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
