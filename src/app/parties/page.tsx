import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";

import { AddCustomerDialog } from "@/components/parties/add-customer-dialog";
import { CustomersTable } from "@/components/parties/customers-table";
import { DemoBanner } from "@/components/parties/demo-banner";
import { OverduePanel } from "@/components/parties/overdue-panel";
import { PartiesSkeleton } from "@/components/parties/skeletons";
import { SummaryCards } from "@/components/parties/summary-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/config";
import { getCustomerAccounts } from "@/lib/credit/data";
import { todayISO } from "@/lib/credit/date";

export const metadata: Metadata = {
  title: "Customers",
  description: "Track customer credit sales, payments and overdue balances.",
};

export default function PartiesPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Customers &amp; credit
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track credit sales (Udharo), part payments and past-due balances.
            </p>
          </div>
          <AddCustomerDialog />
        </header>

        {!isSupabaseConfigured() ? <DemoBanner /> : null}

        <Suspense fallback={<PartiesSkeleton />}>
          <PartiesContent />
        </Suspense>
      </div>
    </main>
  );
}

async function PartiesContent() {
  await connection();

  const today = todayISO();
  const accounts = await getCustomerAccounts(today);
  const overdueAccounts = accounts.filter((account) => account.overdue);

  return (
    <div className="space-y-8">
      <SummaryCards accounts={accounts} />
      <OverduePanel accounts={overdueAccounts} />

      <Card>
        <CardHeader>
          <CardTitle>Customer balances</CardTitle>
          <CardDescription>
            Outstanding balance is credit sales minus recorded payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomersTable accounts={accounts} today={today} />
        </CardContent>
      </Card>
    </div>
  );
}
