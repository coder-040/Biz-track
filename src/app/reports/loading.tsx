import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-24" />
      <Skeleton className="h-72" />
    </main>
  );
}
