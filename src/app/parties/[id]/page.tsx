import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";

import { AccountSummary } from "@/components/parties/account-summary";
import { DemoBanner } from "@/components/parties/demo-banner";
import { Ledger } from "@/components/parties/ledger";
import { CustomerDetailSkeleton } from "@/components/parties/skeletons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/config";
import { getCustomerAccount } from "@/lib/credit/data";
import { todayISO } from "@/lib/credit/date";
import { formatPartyType } from "@/lib/format";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerPage({ params }: CustomerPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<CustomerDetailSkeleton />}>
        <CustomerDetail params={params} />
      </Suspense>
    </main>
  );
}

async function CustomerDetail({ params }: CustomerPageProps) {
  await connection();

  const { id } = await params;
  const today = todayISO();
  const account = await getCustomerAccount(id, today);

  if (!account) notFound();

  const contact = [account.party.phone, account.party.address]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <Link
        href="/parties"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to parties
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {account.party.name}
          </h1>
          <Badge variant="outline">
            {formatPartyType(account.party.type)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {contact || "No contact details recorded."}
        </p>
      </header>

      {!isSupabaseConfigured() ? <DemoBanner /> : null}

      <AccountSummary account={account} />

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
          <CardDescription>
            Credit sales and payments for this customer, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Ledger account={account} />
        </CardContent>
      </Card>
    </div>
  );
}
