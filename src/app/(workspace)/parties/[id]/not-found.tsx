import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CustomerNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h2 className="mt-1 font-heading text-xl font-semibold">
        Customer not found
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This customer does not exist, or it belongs to a different business.
      </p>
      <Link
        href="/parties"
        className={cn(buttonVariants({ variant: "outline" }), "mt-5")}
      >
        Back to parties
      </Link>
    </main>
  );
}
