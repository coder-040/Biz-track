import type { Metadata } from "next";
import { Suspense } from "react";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";
import { SuppliersSkeleton } from "@/components/suppliers/suppliers-skeleton";
import {
  getSupplierOrderData,
  getRole,
  getSupplierParties,
  getSupplierTransactions,
} from "@/lib/suppliers/data";
import { getActiveProducts } from "@/lib/inventory-data";
import { buildSupplierOrders } from "@/lib/suppliers/orders";

export const metadata: Metadata = {
  title: "Suppliers | BizTrack",
  description: "Manage supplier orders, payments and outstanding payables.",
};

async function SuppliersLoader() {
  const [parties, transactions, orderData, role, products] = await Promise.all([
    getSupplierParties(),
    getSupplierTransactions(),
    getSupplierOrderData(),
    getRole(),
    getActiveProducts(),
  ]);
  const orders = buildSupplierOrders(
    orderData.orders,
    orderData.payments,
    parties.map(({ id, name }) => ({ id, name })),
  );

  return (
    <SuppliersClient
      initialParties={parties}
      initialTransactions={transactions}
      initialOrders={orders}
      initialProducts={products}
      role={role}
    />
  );
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Suppliers and orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track supplier orders, receive goods, record payments and review
          outstanding payables.
        </p>
      </header>

      <Suspense fallback={<SuppliersSkeleton />}>
        <SuppliersLoader />
      </Suspense>
    </main>
  );
}
