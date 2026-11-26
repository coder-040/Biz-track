import { Skeleton } from "@/components/ui/skeleton";

export function InventorySkeleton() {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Loading stockroom"
    >
      <header className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-8 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-3 h-4 w-full max-w-48" />
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card px-4">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-8 gap-4 border-b py-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-full max-w-24" />
                ))}
              </div>
              <div className="divide-y divide-border">
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="grid grid-cols-8 items-center gap-4 py-4"
                  >
                    {Array.from({ length: 8 }).map((_, cellIndex) => (
                      <div key={cellIndex} className="min-w-0">
                        {cellIndex === 0 ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full max-w-32" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        ) : cellIndex === 6 ? (
                          <Skeleton className="h-6 w-16 rounded-full" />
                        ) : cellIndex === 7 ? (
                          <Skeleton className="h-8 w-14 rounded-md" />
                        ) : (
                          <Skeleton className="h-4 w-full max-w-20" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card">
          <div className="space-y-2 border-b border-border p-5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-6 w-36" />
            </div>
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
          <div className="space-y-4 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 max-w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>

    </main>
  );
}
