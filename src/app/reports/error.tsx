"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Reports failed to load", error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Could not load reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Report data could not be loaded. Check the database connection and try again.
          </p>
          <Button type="button" onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
