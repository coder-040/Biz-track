import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsClient } from "@/components/reports/reports-client";
import { getReportSources } from "@/lib/reports/data";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Reports | BizTrack",
  description: "Review and export date-filtered finance, credit and inventory reports.",
};

async function ReportsLoader() {
  const sources = await getReportSources();
  return <ReportsClient sources={sources} />;
}

export default function ReportsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review business activity and export a filtered report for your records.
        </p>
      </header>
      <Suspense
        fallback={
          <div className="space-y-4" aria-label="Loading reports">
            <Skeleton className="h-24" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-72" />
          </div>
        }
      >
        <ReportsLoader />
      </Suspense>
    </main>
  );
}
