import type { ReactNode } from "react"
import Link from "next/link"
import { BellIcon, CalendarDaysIcon, PlusIcon } from "lucide-react"

import { MobileNav } from "@/components/dashboard/mobile-nav"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TodayDate } from "@/components/dashboard/today-date"
import { TopbarSearch } from "@/components/dashboard/topbar-search"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/90 px-3 backdrop-blur sm:px-5">
          <MobileNav />
          <TopbarSearch />

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-xl bg-secondary/70 px-3 py-2 text-xs font-medium text-muted-foreground xl:flex">
              <CalendarDaysIcon className="size-4" aria-hidden="true" />
              <TodayDate />
            </span>

            <button
              type="button"
              className="relative flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Notifications"
            >
              <BellIcon className="size-4" aria-hidden="true" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive" />
            </button>

            <Link
              href="/inventory?add=1"
              className={cn(
                buttonVariants({ size: "lg" }),
                "hidden rounded-xl sm:inline-flex"
              )}
            >
              <PlusIcon aria-hidden="true" />
              Add
            </Link>

            <div
              className="flex size-9 items-center justify-center rounded-full bg-gold text-xs font-bold text-gold-foreground"
              aria-label="Demo profile"
            >
              BT
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
