import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const primaryCtaClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_-14px_rgba(4,120,87,0.9)] transition-all hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_18px_38px_-16px_rgba(4,120,87,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:translate-y-0";

export const secondaryCtaClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 active:translate-y-0";

interface CtaLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function CtaLink({
  href,
  children,
  variant = "primary",
  className,
}: CtaLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        variant === "primary" ? primaryCtaClass : secondaryCtaClass,
        className,
      )}
    >
      {children}
    </Link>
  );
}
