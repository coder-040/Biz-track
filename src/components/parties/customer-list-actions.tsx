"use client";

import { useState } from "react";
import Link from "next/link";

import { CreditSaleForm } from "@/components/parties/credit-sale-form";
import { PaymentForm } from "@/components/parties/payment-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CustomerSummary } from "@/lib/credit/types";
import { cn } from "@/lib/utils";

interface CustomerListActionsProps {
  account: CustomerSummary;
  today: string;
}

type ActionMode = "credit" | "payment" | null;

export function CustomerListActions({
  account,
  today,
}: CustomerListActionsProps) {
  const [mode, setMode] = useState<ActionMode>(null);
  const { party } = account;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setMode("credit")}
        >
          Add credit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setMode("payment")}
          disabled={account.balance <= 0}
        >
          Record payment
        </Button>
        <Link
          href={`/parties/${party.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Details
        </Link>
      </div>

      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
      >
        {mode ? (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {mode === "credit" ? "Add credit sale" : "Record payment"} for{" "}
                {party.name}
              </DialogTitle>
              <DialogDescription>
                {mode === "credit"
                  ? "Record a purchase made by this customer on credit."
                  : "Record a payment and apply it to this customer's outstanding balance."}
              </DialogDescription>
            </DialogHeader>
            {mode === "credit" ? (
              <CreditSaleForm
                key={`${party.id}-credit`}
                partyId={party.id}
                today={today}
                idPrefix={`customer-${party.id}-credit`}
              />
            ) : (
              <PaymentForm
                key={`${party.id}-payment`}
                partyId={party.id}
                today={today}
                balance={account.balance}
                idPrefix={`customer-${party.id}-payment`}
              />
            )}
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
