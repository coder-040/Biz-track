import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Passbook — BizTrack",
  description: "View your business passbook and statement.",
};

export default function PassbookPage() {
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
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-stone-950">
                  Passbook
                </CardTitle>
                <CardDescription>
                  Transaction statement and balance history
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <Construction className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  This feature is planned for the MVP. It will show a passbook-style statement of cash and bank/online movements with date filters and exports.
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-600">
              For now, use Recent Transactions on the dashboard to review the latest activity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
