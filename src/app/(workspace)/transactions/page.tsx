
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { TransactionsClient } from "@/components/transactions/transactions-client";
import { TransactionsSkeleton } from "@/components/transactions/transactions-skeleton";
import {
  getRole,
  getTotals,
  getTransactions,
} from "@/lib/transactions/data";
import { parseTransactionFilters } from "@/lib/transactions/filters";

export const metadata: Metadata = {
  title: "Transactions | BizTrack",
  description: "Record and review income, expenses, and related payments.",
};

async function TransactionsLoader({
  searchParams,
}: Pick<PageProps<"/transactions">, "searchParams">) {
  await connection();

  const filters = parseTransactionFilters(await searchParams);

  const [initialRows, totals, role] = await Promise.all([
    getTransactions(filters),
    getTotals(),
    getRole(),
  ]);

  return (
    <TransactionsClient
      initialRows={initialRows}
      totals={totals}
      role={role}
      initialFilters={filters}
    />
  );
}

export default function Page({ searchParams }: PageProps<"/transactions">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record everyday income and expenses. Totals also include customer
          receipts and paid supplier costs from their ledgers.
        </p>
      </header>

      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
