"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CustomerError({
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
        Couldn&apos;t load this customer
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Something went wrong while loading the customer ledger. Check the server
        logs, then try again.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => retry()}>Try again</Button>
        <Link
          href="/parties"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to parties
        </Link>
      </div>
    </main>
  );
}
