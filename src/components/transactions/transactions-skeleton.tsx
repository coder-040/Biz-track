import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-3 animate-pulse rounded bg-muted ${className}`} />
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading transactions">
      <Card>
        <CardHeader>
          <CardTitle>Today &amp; balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <SkeletonLine className="w-20" />
                <SkeletonLine className="h-6 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <SkeletonLine className="w-24" />
                <SkeletonLine className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonLine key={index} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
