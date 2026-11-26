import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";

import { SalesClient } from "@/components/sales/sales-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { todayISOInTimeZone } from "@/lib/date";
import { getProductSaleOptions } from "@/lib/sales/data";

export const metadata: Metadata = {
  title: "Product sales | BizTrack",
  description: "Record product sales, customer credit and inventory movements.",
};

async function SalesContent() {
  await connection();
  const { products, customers } = await getProductSaleOptions();
  const today = todayISOInTimeZone("Asia/Kathmandu");

  return (
    <SalesClient products={products} customers={customers} today={today} />
  );
}

export default function SalesPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Product sales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record paid sales as income or assign a credit sale to a customer.
          Every sale also updates product stock and movement history.
        </p>
      </header>
      <Suspense
        fallback={
          <Card>
            <CardContent className="grid gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        }
      >
        <SalesContent />
      </Suspense>
    </main>
  );
}
