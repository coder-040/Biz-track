"use client"

import { useRef, useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftRightIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { recordStockMovement } from "@/app/inventory/actions"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { initialActionState } from "@/lib/action-state"
import { formatQuantity } from "@/lib/format"
import {
  calculateNewStock,
  type Product,
  type StockMovementType,
} from "@/lib/inventory"

const movementTypes: Array<{ value: StockMovementType; label: string }> = [
  { value: "damaged", label: "Damaged (remove stock)" },
  { value: "lost", label: "Lost (remove stock)" },
  { value: "adjustment", label: "Adjustment (increase or decrease)" },
]

interface RecordMovementDialogProps {
  product: Pick<Product, "id" | "name" | "current_stock">
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  defaultQuantity?: number
}

export function RecordMovementDialog({
  product,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  defaultQuantity = 1,
}: RecordMovementDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const [type, setType] = useState<StockMovementType>("adjustment")
  const [quantity, setQuantity] = useState(String(defaultQuantity))
  const [adjustmentDirection, setAdjustmentDirection] = useState<
    "increase" | "decrease"
  >("increase")
  const [pending, startTransition] = useTransition()

  const parsedQuantity = Number(quantity)
  const signedQuantity =
    type === "adjustment" && adjustmentDirection === "decrease"
      ? -Math.abs(parsedQuantity)
      : parsedQuantity
  const resultingStock = Number.isFinite(parsedQuantity)
    ? calculateNewStock(product.current_stock, type, signedQuantity)
    : product.current_stock
  const wouldGoNegative = resultingStock < 0
  const reasonRequired = ["damaged", "lost", "adjustment"].includes(type)

  function resetForm() {
    formRef.current?.reset()
    setType("adjustment")
    setQuantity(String(defaultQuantity))
    setAdjustmentDirection("increase")
  }

  function handleOpenChange(nextOpen: boolean) {
    setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
    if (nextOpen) {
      setType("adjustment")
      setQuantity(String(defaultQuantity))
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await recordStockMovement(initialActionState, formData)

      if (result.status !== "success") {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      resetForm()
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {hideTrigger ? null : (
        <DialogTrigger render={<Button />}>
          <ArrowLeftRightIcon aria-hidden="true" />
          Record movement
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record stock movement</DialogTitle>
          <DialogDescription>
            Record damage, loss, or a stock adjustment for {product.name}. Use
            Restock to add purchased inventory and its expense/payable.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
          <input type="hidden" name="product_id" value={product.id} />

          <div className="grid gap-2">
            <Label htmlFor="movement_type">Movement type</Label>
            <Select
              name="type"
              value={type}
              onValueChange={(value) =>
              setType((value ?? "adjustment") as StockMovementType)
              }
            >
              <SelectTrigger id="movement_type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {movementTypes.map((movement) => (
                  <SelectItem key={movement.value} value={movement.value}>
                    {movement.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "adjustment" ? (
            <div className="grid gap-2">
              <Label htmlFor="adjustment_direction">Adjustment direction</Label>
              <Select
                name="adjustment_direction"
                value={adjustmentDirection}
                onValueChange={(value) =>
                  setAdjustmentDirection(
                    (value ?? "increase") as "increase" | "decrease"
                  )
                }
              >
                <SelectTrigger id="adjustment_direction" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase stock</SelectItem>
                  <SelectItem value="decrease">Decrease stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit_cost">Unit cost (optional)</Label>
              <Input
                id="unit_cost"
                name="unit_cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">
              Reason {reasonRequired ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="reason"
              name="reason"
              required={reasonRequired}
              placeholder="Damaged in transit, stock count correction..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transaction_id">
              Related transaction ID (optional)
            </Label>
            <Input
              id="transaction_id"
              name="transaction_id"
              placeholder="00000000-0000-0000-0000-000000000000"
            />
            <p className="text-xs text-muted-foreground">
              Link a related transaction when one already exists.
            </p>
          </div>

          <div className="grid gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Current stock</span>
              <span>{formatQuantity(product.current_stock)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">After this movement</span>
              <span
                className={
                  wouldGoNegative ? "font-medium text-destructive" : "font-medium"
                }
              >
                {formatQuantity(Number.isFinite(resultingStock) ? resultingStock : 0)}
              </span>
            </div>
            {wouldGoNegative ? (
              <p className="text-destructive">
                This movement would reduce stock below zero.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                pending ||
                wouldGoNegative ||
                !Number.isFinite(parsedQuantity) ||
                parsedQuantity <= 0
              }
            >
              {pending ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <ArrowLeftRightIcon aria-hidden="true" />
              )}
              {pending ? "Saving..." : "Save movement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
