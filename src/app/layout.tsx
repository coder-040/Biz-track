import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { PlusIcon, WalletIcon } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/config";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BizTrack",
    template: "%s · BizTrack",
  },
  description: "Track customer credit (Udharo), payments and overdue balances.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const demo = !isSupabaseConfigured();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full bg-background text-foreground">
        <Sidebar demo={demo} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur lg:hidden">
            <div className="flex h-16 items-center justify-between gap-3 px-4">
              <Link href="/parties" className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-deep text-brand-orange">
                  <WalletIcon className="size-4.5" aria-hidden="true" />
                </span>
                <span className="font-heading text-lg font-bold tracking-tight">
                  BizTrack
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  href="/parties"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "font-semibold",
                  )}
                >
                  Customers
                </Link>
                <Link
                  href="/parties#add-customer"
                  className={buttonVariants({ variant: "brand", size: "sm" })}
                >
                  <PlusIcon aria-hidden="true" />
                  Add
                </Link>
              </div>
            </div>
          </header>

          <header className="sticky top-0 z-30 hidden border-b border-border/60 bg-background/80 backdrop-blur lg:block">
            <div className="mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between gap-4 px-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-card">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      demo ? "bg-brand-orange" : "bg-emerald-500",
                    )}
                    aria-hidden="true"
                  />
                  {demo ? "Demo ledger" : "Live ledger"}
                </span>
                <span className="text-xs font-medium text-muted-foreground/80">
                  Customer credit · Udharo
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/parties#add-customer"
                  className={buttonVariants({ size: "sm" })}
                >
                  <PlusIcon aria-hidden="true" />
                  Add customer
                </Link>
                <span className="grid size-9 place-items-center rounded-full bg-brand-sage text-xs font-bold text-brand-sage-strong ring-1 ring-brand-sage-strong/10">
                  BT
                </span>
              </div>
            </div>
          </header>

          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
