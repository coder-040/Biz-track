"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export function SuppliersSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading suppliers">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-32 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-6 w-full animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-hidden">
            {[0, 1].map((column) => (
              <div
                key={column}
                className="w-72 shrink-0 space-y-3 rounded-xl border p-3"
              >
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                {[0, 1].map((card) => (
                  <div
                    key={card}
                    className="h-36 animate-pulse rounded-lg border bg-muted/40"
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-5 w-56 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-8 w-full animate-pulse rounded bg-muted" />
          <div className="h-8 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-5 w-56 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-12 w-full animate-pulse rounded bg-muted"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
