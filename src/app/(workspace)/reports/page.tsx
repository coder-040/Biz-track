import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsClient } from "@/components/reports/reports-client";
import { ReportsSkeleton } from "@/components/reports/reports-skeleton";
import { getReportSources } from "@/lib/reports/data";

export const metadata: Metadata = {
  title: "Reports | BizTrack",
  description: "Review and export date-filtered finance, credit and inventory reports.",
};

async function ReportsContent() {
  const sources = await getReportSources();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review business activity and export a filtered report for your records.
        </p>
      </header>
      <ReportsClient sources={sources} />
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}
