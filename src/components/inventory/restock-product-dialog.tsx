"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2Icon, PackagePlusIcon } from "lucide-react";
import { toast } from "sonner";

import { recordProductRestock } from "@/app/inventory/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDaysISO } from "@/lib/date";
import type { LowStockProduct } from "@/lib/dashboard";
import type { SupplierOption } from "@/lib/inventory";
import { formatCurrency, formatQuantity } from "@/lib/format";

type PaymentStatus = "unpaid" | "partial" | "paid";

interface RestockProductDialogProps {
  product: LowStockProduct;
  suppliers: SupplierOption[];
  today: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestockProductDialog({
  product,
  suppliers,
  today,
  open,
  onOpenChange,
}: RestockProductDialogProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const defaultSupplierId =
    suppliers.find((supplier) => supplier.id === product.supplier_id)?.id ??
    suppliers[0]?.id ??
    "";
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    defaultSupplierId ? "unpaid" : "paid",
  );
  const [quantity, setQuantity] = useState(
    String(Math.max(1, product.min_stock - product.current_stock)),
  );
  const [unitCost, setUnitCost] = useState(String(product.purchase_price));
  const [paidAmount, setPaidAmount] = useState("");
  const [supplierId, setSupplierId] = useState(defaultSupplierId);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionDate, setTransactionDate] = useState(today);
  const [dueDate, setDueDate] = useState(addDaysISO(today, 30));
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  const quantityValue = Number(quantity);
  const unitCostValue = Number(unitCost);
  const total = Number.isFinite(quantityValue * unitCostValue)
    ? Math.round((quantityValue * unitCostValue + Number.EPSILON) * 100) / 100
    : 0;
  const amountPaid =
    paymentStatus === "paid"
      ? total
      : paymentStatus === "partial"
        ? Number(paidAmount) || 0
        : 0;
  const payable = Math.max(0, Math.round((total - amountPaid + Number.EPSILON) * 100) / 100);
  const needsPaymentMethod = paymentStatus !== "unpaid";
  const missingSupplierForPayable = payable > 0 && !supplierId;

  function resetForm() {
    formRef.current?.reset();
    setPaymentStatus(defaultSupplierId ? "unpaid" : "paid");
    setQuantity(String(Math.max(1, product.min_stock - product.current_stock)));
    setUnitCost(String(product.purchase_price));
    setPaidAmount("");
    setSupplierId(defaultSupplierId);
    setPaymentMethod("cash");
    setTransactionDate(today);
    setDueDate(addDaysISO(today, 30));
    setDescription("");
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (nextOpen) {
      resetForm();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("paid_amount", amountPaid.toFixed(2));

    startTransition(async () => {
      const result = await recordProductRestock(formData);
      if (result.status !== "success") {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Restock {product.name}</DialogTitle>
          <DialogDescription>
            A supplier is optional for a fully paid restock. Any unpaid balance
            requires a supplier and is added to its payable.
          </DialogDescription>
        </DialogHeader>

        {suppliers.length === 0 ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            You can record a paid restock without a supplier. Add a supplier if
            any amount will remain unpaid.{" "}
            <Link href="/suppliers" className="font-semibold underline">
              Manage suppliers
            </Link>
          </div>
        ) : null}

        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="paid_amount" value={amountPaid.toFixed(2)} />

          <div className="grid gap-2">
            <Label htmlFor="restock-supplier">Supplier (optional)</Label>
            <select
              id="restock-supplier"
              name="supplier_id"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              disabled={pending}
            >
              <option value="">
                No supplier
              </option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="restock-quantity">Quantity</Label>
              <Input
                id="restock-quantity"
                name="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="restock-unit-cost">Unit cost</Label>
              <Input
                id="restock-unit-cost"
                name="unit_cost"
                type="number"
                min="0.01"
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
                required
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="restock-payment-status">Payment status</Label>
            <select
              id="restock-payment-status"
              value={paymentStatus}
              onChange={(event) =>
                setPaymentStatus(event.target.value as PaymentStatus)
              }
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              disabled={pending}
            >
              <option value="unpaid">Unpaid — add to supplier payable</option>
              <option value="partial">Partially paid</option>
              <option value="paid">Paid in full</option>
            </select>
            {missingSupplierForPayable ? (
              <p role="alert" className="text-sm text-destructive">
                Choose a supplier or mark the restock as paid in full.
              </p>
            ) : null}
          </div>

          {paymentStatus === "partial" ? (
            <div className="grid gap-2">
              <Label htmlFor="restock-paid-amount">Amount paid now</Label>
              <Input
                id="restock-paid-amount"
                type="number"
                min="0"
                max={total}
                step="0.01"
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                required
                disabled={pending}
              />
            </div>
          ) : null}

          {needsPaymentMethod ? (
            <div className="grid gap-2">
              <Label htmlFor="restock-payment-method">Payment method</Label>
              <select
                id="restock-payment-method"
                name="payment_method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                disabled={pending}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="qr">QR</option>
                <option value="online">Online</option>
              </select>
            </div>
          ) : (
            <input type="hidden" name="payment_method" value="cash" />
          )}

          {payable > 0 ? (
            <div className="grid gap-2">
              <Label htmlFor="restock-due-date">Due date for unpaid balance</Label>
              <Input
                id="restock-due-date"
                name="due_date"
                type="date"
                min={transactionDate}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                required
                disabled={pending}
              />
            </div>
          ) : (
            <input type="hidden" name="due_date" value="" />
          )}

          <div className="grid gap-2">
            <Label htmlFor="restock-date">Purchase date</Label>
            <Input
              id="restock-date"
              name="transaction_date"
              type="date"
              max={today}
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
              required
              disabled={pending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="restock-description">Note (optional)</Label>
            <Input
              id="restock-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional purchase note"
              disabled={pending}
            />
          </div>

          <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Current stock</span>
              <span>{formatQuantity(product.current_stock)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Restock total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {payable > 0 ? (
              <div className="flex justify-between gap-3 font-medium">
                <span>Supplier payable</span>
                <span>{formatCurrency(payable)}</span>
              </div>
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
              disabled={pending || total <= 0 || missingSupplierForPayable}
            >
              {pending ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <PackagePlusIcon aria-hidden="true" />
              )}
              {pending ? "Saving restock…" : "Record restock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
