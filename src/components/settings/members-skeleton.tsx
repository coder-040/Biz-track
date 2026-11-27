import { Skeleton } from "@/components/ui/skeleton";

export function MembersSkeleton() {
  return (
    <main
      className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-label="Loading team members"
    >
      <header className="mb-6 space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 divide-y divide-stone-100">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <Skeleton className="h-5 w-44" />
          <div className="mt-4 divide-y divide-stone-100">
            {[0, 1].map((index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
