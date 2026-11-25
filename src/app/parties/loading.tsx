import { PartiesSkeleton } from "@/components/parties/skeletons";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="h-8" />
        <PartiesSkeleton />
      </div>
    </main>
  );
}
