"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2Icon, ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";

import { recordProductSale } from "@/app/sales/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDaysISO } from "@/lib/date";
import type { ProductSaleProduct, SaleCustomer } from "@/lib/sales/data";
import { formatCurrency, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = ["cash", "bank", "qr", "online", "credit"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

interface SalesClientProps {
  products: ProductSaleProduct[];
  customers: SaleCustomer[];
  today: string;
  embedded?: boolean;
  onRecorded?: () => void;
}

export function SalesClient({
  products,
  customers,
  today,
  embedded = false,
  onRecorded,
}: SalesClientProps) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [customerId, setCustomerId] = useState("");
  const [transactionDate, setTransactionDate] = useState(today);
  const [dueDate, setDueDate] = useState(addDaysISO(today, 30));
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedProduct = products.find((product) => product.id === productId);
  const quantityValue = Number(quantity);
  const total = selectedProduct && Number.isFinite(quantityValue)
    ? Math.round(
        (quantityValue * selectedProduct.selling_price + Number.EPSILON) * 100,
      ) / 100
    : 0;
  const exceedsStock =
    selectedProduct !== undefined &&
    Number.isFinite(quantityValue) &&
    quantityValue > selectedProduct.current_stock;

  function resetForm() {
    setProductId("");
    setQuantity("1");
    setPaymentMethod("cash");
    setCustomerId("");
    setTransactionDate(today);
    setDueDate(addDaysISO(today, 30));
    setDescription("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await recordProductSale(formData);
      if (result.status !== "success") {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      resetForm();
      onRecorded?.();
      router.refresh();
    });
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <ShoppingCartIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium">No active products to sell</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a product to inventory before recording a sale.
            </p>
          </div>
          <Link href="/inventory" className={cn(buttonVariants())}>
            Go to inventory
          </Link>
        </CardContent>
      </Card>
    );
  }

  const form = (
    <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="sale-product">Product</Label>
              <select
                id="sale-product"
                name="product_id"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                required
                disabled={pending}
              >
                <option value="" disabled>
                  Choose a product
                </option>
                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={product.current_stock <= 0}
                  >
                    {product.name} · {formatQuantity(product.current_stock)} in stock ·{" "}
                    {formatCurrency(product.selling_price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sale-quantity">Quantity</Label>
              <Input
                id="sale-quantity"
                name="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
                disabled={pending || !selectedProduct}
              />
              {exceedsStock ? (
                <p className="text-sm text-destructive">
                  Only {formatQuantity(selectedProduct.current_stock)} available.
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sale-payment-method">Payment</Label>
              <select
                id="sale-payment-method"
                name="payment_method"
                value={paymentMethod}
                onChange={(event) => {
                  const method = event.target.value;
                  if (PAYMENT_METHODS.includes(method as PaymentMethod)) {
                    setPaymentMethod(method as PaymentMethod);
                    if (method !== "credit") setCustomerId("");
                  }
                }}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                disabled={pending}
              >
                <option value="cash">Paid — Cash</option>
                <option value="bank">Paid — Bank</option>
                <option value="qr">Paid — QR</option>
                <option value="online">Paid — Online</option>
                <option value="credit">On customer credit</option>
              </select>
            </div>

            {paymentMethod === "credit" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="sale-customer">Customer</Label>
                  <select
                    id="sale-customer"
                    name="customer_id"
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    required
                    disabled={pending || customers.length === 0}
                  >
                    <option value="" disabled>
                      Choose a customer
                    </option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {customers.length === 0 ? (
                    <p className="text-sm text-destructive">
                      Add a customer before recording a credit sale.
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sale-due-date">Due date</Label>
                  <Input
                    id="sale-due-date"
                    name="due_date"
                    type="date"
                    min={transactionDate}
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    required
                    disabled={pending}
                  />
                </div>
              </>
            ) : (
              <>
                <input type="hidden" name="customer_id" value="" />
                <input type="hidden" name="due_date" value="" />
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="sale-date">Sale date</Label>
              <Input
                id="sale-date"
                name="transaction_date"
                type="date"
                max={today}
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                required
                disabled={pending}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="sale-description">Note (optional)</Label>
              <Input
                id="sale-description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional sale note"
                disabled={pending}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Sale total</span>
              <span className="text-lg font-semibold">{formatCurrency(total)}</span>
            </div>
            {selectedProduct ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatQuantity(quantityValue || 0)} ×{" "}
                {formatCurrency(selectedProduct.selling_price)} per unit
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={
              pending ||
              !selectedProduct ||
              total <= 0 ||
              exceedsStock ||
              (paymentMethod === "credit" && customers.length === 0)
            }
          >
            {pending ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <ShoppingCartIcon aria-hidden="true" />
            )}
            {pending
              ? "Recording sale…"
              : paymentMethod === "credit"
                ? "Record credit sale"
                : "Record sale as income"}
          </Button>
    </form>
  );

  if (embedded) return form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record a product sale</CardTitle>
        <CardDescription>
          Paid sales are recorded as income. Credit sales update the customer&apos;s
          balance. Both reduce stock and add a movement to product history.
        </CardDescription>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
