"use client";

import { useState } from "react";
import { ShoppingCartIcon } from "lucide-react";

import { SalesClient } from "@/components/sales/sales-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProductSaleProduct, SaleCustomer } from "@/lib/sales/data";

interface ProductSaleDialogProps {
  products: ProductSaleProduct[];
  customers: SaleCustomer[];
  today: string;
}

export function ProductSaleDialog({
  products,
  customers,
  today,
}: ProductSaleDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setFormKey((key) => key + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            className="bg-white text-[#0C3B37] shadow-xs hover:bg-emerald-50"
          />
        }
      >
        <ShoppingCartIcon aria-hidden="true" />
        Record sale
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record a product sale</DialogTitle>
          <DialogDescription>
            Paid sales count as income. A customer is only needed for a credit
            sale. Stock is updated when the sale is recorded.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <SalesClient
            key={formKey}
            products={products}
            customers={customers}
            today={today}
            embedded
            onRecorded={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
