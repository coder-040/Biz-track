import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Transfer / Reconcile — BizTrack",
  description: "Transfer and reconcile cash and bank balances.",
};

export default function ReconcilePage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <Card className="rounded-2xl border-stone-200 bg-white shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0C3B37]/10 text-[#0C3B37]">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-stone-950">
                  Transfer / Reconcile
                </CardTitle>
                <CardDescription>
                  Cash and bank balance adjustments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <Construction className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  This feature is planned for the MVP. It will let you record transfers between Cash and Bank/Online and reconcile balances.
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-600">
              For now, track balance changes through income, expense, and payment transactions from the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
