"use client"

import { useRef, useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { createProduct } from "@/app/inventory/actions"
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
import { RequiredMark } from "@/components/ui/required-mark"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { initialActionState } from "@/lib/action-state"
import type { SupplierOption } from "@/lib/inventory"

interface AddProductDialogProps {
  suppliers: SupplierOption[]
}

export function AddProductDialog({ suppliers }: AddProductDialogProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [supplierId, setSupplierId] = useState("none")
  const [pending, startTransition] = useTransition()

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await createProduct(initialActionState, formData)

      if (result.status !== "success") {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      formRef.current?.reset()
      setSupplierId("none")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" />}>
        <PlusIcon aria-hidden="true" />
        Add product
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Create a product with its opening stock, pricing and reorder level.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Product name <RequiredMark />
            </Label>
            <Input id="name" name="name" required placeholder="A4 paper ream" />
            <p className="text-xs text-muted-foreground">
              Product names must be unique. Include size or variant in the name
              when needed.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU / code (optional)</Label>
              <Input id="sku" name="sku" placeholder="A4-500" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input id="category" name="category" placeholder="Stationery" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="purchase_price">
                Purchase price <RequiredMark />
              </Label>
              <Input
                id="purchase_price"
                name="purchase_price"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="selling_price">
                Selling price <RequiredMark />
              </Label>
              <Input
                id="selling_price"
                name="selling_price"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="current_stock">
                Opening stock <RequiredMark />
              </Label>
              <Input
                id="current_stock"
                name="current_stock"
                type="number"
                min="0"
                step="0.001"
                defaultValue="0"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="min_stock">
                Low-stock threshold <RequiredMark />
              </Label>
              <Input
                id="min_stock"
                name="min_stock"
                type="number"
                min="0"
                step="0.001"
                defaultValue="0"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="supplier_id">Supplier (optional)</Label>
            <Select
              name="supplier_id"
              value={supplierId}
              onValueChange={(value) =>
                setSupplierId(value == null ? "none" : String(value))
              }
            >
              <SelectTrigger id="supplier_id" className="w-full">
                <SelectValue placeholder="No supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <PlusIcon aria-hidden="true" />
              )}
              {pending ? "Adding..." : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
