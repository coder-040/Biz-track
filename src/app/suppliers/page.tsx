import type { Metadata } from "next";
import { Suspense } from "react";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";
import { SuppliersSkeleton } from "@/components/suppliers/suppliers-skeleton";
import {
  getRole,
  getSupplierParties,
  getSupplierTransactions,
} from "@/lib/suppliers/data";

export const metadata: Metadata = {
  title: "Suppliers | BizTrack",
  description: "Track supplier purchases, payments and outstanding payables.",
};

async function SuppliersLoader() {
  const [parties, transactions, role] = await Promise.all([
    getSupplierParties(),
    getSupplierTransactions(),
    getRole(),
  ]);

  return (
    <SuppliersClient
      initialParties={parties}
      initialTransactions={transactions}
      role={role}
    />
  );
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Supplier payments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record purchases on credit and partial payments, and see who is
          overdue. A dealer is a party of type supplier or both.
        </p>
      </header>

      <Suspense fallback={<SuppliersSkeleton />}>
        <SuppliersLoader />
      </Suspense>
    </main>
  );
}
