"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddProductDialog } from "@/components/inventory/add-product-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { todayISOInTimeZone } from "@/lib/date";
import {
  SUPPLIER_PAYMENT_METHODS,
  type PartyRow,
} from "@/lib/suppliers/types";
import type { NewSupplierOrderInput } from "@/lib/suppliers/orders";
import type { ProductOption } from "@/lib/inventory";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const labelClass = "block text-sm font-medium";
const todayInNepal = () => todayISOInTimeZone("Asia/Kathmandu");

interface AddSupplierOrderDialogProps {
  suppliers: PartyRow[];
  products: ProductOption[];
  busy: boolean;
  onSubmit: (input: NewSupplierOrderInput) => Promise<void>;
}

function emptyForm(): NewSupplierOrderInput {
  return {
    supplierId: "",
    productId: "",
    quantity: "1",
    items: "",
    category: "",
    totalAmount: "",
    orderDate: todayInNepal(),
    dueDate: "",
    paymentType: "credit",
    paymentMethod: null,
    attachmentUrl: "",
  };
}

function messageFor(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Could not create the order.";
}

export function AddSupplierOrderDialog({
  suppliers,
  products,
  busy,
  onSubmit,
}: AddSupplierOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewSupplierOrderInput>(emptyForm);

  function update<K extends keyof NewSupplierOrderInput>(
    key: K,
    value: NewSupplierOrderInput[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onSubmit(form);
      setForm(emptyForm());
      setOpen(false);
    } catch (submitError) {
      toast.error(messageFor(submitError));
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setForm(emptyForm());
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" disabled={busy || suppliers.length === 0} />}>
        <Plus aria-hidden="true" />
        Add order
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add supplier order</DialogTitle>
          <DialogDescription>
            New orders begin in Ordered. Paid-now expenses are recorded on the
            order date; credit becomes payable when received.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className={labelClass} htmlFor="order-supplier">
                Supplier
              </label>
              <select
                id="order-supplier"
                className={selectClass}
                value={form.supplierId}
                onChange={(event) => update("supplierId", event.target.value)}
                required
              >
                <option value="">Choose a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className={labelClass} htmlFor="order-product">
                Product
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  id="order-product"
                  className={selectClass}
                  value={form.productId}
                  onChange={(event) => {
                    const product = products.find(
                      (candidate) => candidate.id === event.target.value,
                    );
                    update("productId", product?.id ?? "");
                    update("items", product?.name ?? "");
                  }}
                  required
                >
                  <option value="">Choose an existing product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.sku ? ` · ${product.sku}` : ""}
                    </option>
                  ))}
                </select>
                <AddProductDialog suppliers={suppliers} />
              </div>
              {products.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add a product before creating an order.
                </p>
              ) : null}
            </div>
            <div className="space-y-1">
              <label className={labelClass} htmlFor="order-quantity">
                Quantity
              </label>
              <Input
                id="order-quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={(event) => update("quantity", event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass} htmlFor="order-total">
                Total amount (Rs.)
              </label>
              <Input
                id="order-total"
                inputMode="decimal"
                type="number"
                min="0.01"
                step="0.01"
                value={form.totalAmount}
                onChange={(event) => update("totalAmount", event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass} htmlFor="order-category">
                Category
              </label>
              <Input
                id="order-category"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                placeholder="e.g. Inventory"
                required
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass} htmlFor="order-date">
                Order date
              </label>
              <Input
                id="order-date"
                type="date"
                max={todayInNepal()}
                value={form.orderDate}
                onChange={(event) => update("orderDate", event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass} htmlFor="order-due-date">
                Due date (required)
              </label>
              <Input
                id="order-due-date"
                type="date"
                min={form.orderDate}
                value={form.dueDate}
                onChange={(event) => update("dueDate", event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass} htmlFor="order-payment-type">
                Payment type
              </label>
              <select
                id="order-payment-type"
                className={selectClass}
                value={form.paymentType}
                onChange={(event) => {
                  const paymentType = event.target.value === "paid_now"
                    ? "paid_now"
                    : "credit";
                  setForm((previous) => ({
                    ...previous,
                    paymentType,
                    paymentMethod:
                      paymentType === "paid_now" ? "cash" : null,
                  }));
                }}
              >
                <option value="paid_now">Paid now</option>
                <option value="credit">On credit</option>
              </select>
            </div>
            {form.paymentType === "paid_now" ? (
              <div className="space-y-1">
                <label className={labelClass} htmlFor="order-payment-method">
                  Payment method
                </label>
                <select
                  id="order-payment-method"
                  className={selectClass}
                  value={form.paymentMethod ?? "cash"}
                  onChange={(event) =>
                    update(
                      "paymentMethod",
                      SUPPLIER_PAYMENT_METHODS.find(
                        (method) => method === event.target.value,
                      ) ?? "cash",
                    )
                  }
                >
                  {SUPPLIER_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="space-y-1 sm:col-span-2">
              <label className={labelClass} htmlFor="order-attachment">
                Attachment URL (optional)
              </label>
              <Input
                id="order-attachment"
                type="url"
                value={form.attachmentUrl}
                onChange={(event) => update("attachmentUrl", event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving order…" : "Create order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
