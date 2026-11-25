"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function PartiesError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h2 className="font-heading text-xl font-semibold">
        Couldn&apos;t load customers
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Something went wrong while loading customer credit data. Check the
        server logs, then try again.
      </p>
      <Button className="mt-5" onClick={() => retry()}>
        Try again
      </Button>
    </main>
  );
}
