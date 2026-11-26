import { Skeleton } from "@/components/ui/skeleton";

export function ReportsSkeleton() {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Loading reports"
    >
      <header className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </header>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_auto] lg:items-end sm:p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </section>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-[32rem] max-w-full" />
        </div>
        <Skeleton className="h-4 w-14" />
      </header>

      <section
        aria-label="Loading report totals"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-7 w-32" />
          </div>
        ))}
      </section>

      <div className="overflow-x-auto rounded-xl border border-border bg-card px-4">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-4 gap-4 border-b py-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full max-w-24" />
            ))}
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-4 items-center gap-4 py-4"
              >
                {Array.from({ length: 4 }).map((_, cellIndex) => (
                  <Skeleton
                    key={cellIndex}
                    className={`h-4 ${
                      cellIndex === 0 ? "w-24" : "ml-auto w-28"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
