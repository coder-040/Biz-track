import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex bg-[#F8F6F2]">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-56 shrink-0 bg-[#0C3B37] p-4 space-y-4">
        <Skeleton className="h-10 w-full bg-white/10 rounded-xl" />
        <Skeleton className="h-10 w-full bg-[#F4C44E]/30 rounded-xl" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-9 w-full bg-white/10 rounded-xl" />
          <Skeleton className="h-9 w-full bg-white/10 rounded-xl" />
          <Skeleton className="h-9 w-full bg-white/10 rounded-xl" />
          <Skeleton className="h-9 w-full bg-white/10 rounded-xl" />
        </div>
      </div>

      {/* Main skeleton */}
      <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-5">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
