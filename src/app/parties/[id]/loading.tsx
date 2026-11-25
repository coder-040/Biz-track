import { CustomerDetailSkeleton } from "@/components/parties/skeletons";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <CustomerDetailSkeleton />
    </main>
  );
}
