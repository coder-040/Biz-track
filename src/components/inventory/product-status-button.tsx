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
import { initialActionState } from "@/lib/action-state"

interface ProductStatusButtonProps {
  productId: string
  isActive: boolean
}

export function ProductStatusButton({
  productId,
  isActive,
}: ProductStatusButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = isActive
        ? await archiveProduct(initialActionState, formData)
        : await restoreProduct(initialActionState, formData)

      if (result.status !== "success") {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant={isActive ? "destructive" : "outline"} />}
      >
        {isActive ? (
          <ArchiveIcon aria-hidden="true" />
        ) : (
          <RotateCcwIcon aria-hidden="true" />
        )}
        {isActive ? "Archive product" : "Restore product"}
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
