"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeftRightIcon,
  BoxesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LayoutGridIcon,
  LineChartIcon,
  PlusCircleIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: LucideIcon
  href: string | null
}

const navItems: NavItem[] = [
  { label: "Overview", icon: LayoutGridIcon, href: null },
  { label: "Money Flow", icon: ArrowLeftRightIcon, href: null },
  { label: "Stockroom", icon: BoxesIcon, href: "/inventory" },
  { label: "Insights", icon: LineChartIcon, href: null },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2 text-center">
        <p className="text-xl font-bold tracking-tight text-sidebar-foreground">
          BizTrack
        </p>
        <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-sidebar-foreground/60">
          व्यापार बुक · Nepal Edition
        </p>
      </div>

      <Link
        href="/inventory?add=1"
        onClick={onNavigate}
        className={cn(
          buttonVariants({ variant: "gold", size: "lg" }),
          "w-full justify-center rounded-xl"
        )}
      >
        <PlusCircleIcon aria-hidden="true" />
        Quick Add
      </Link>

      <div className="flex flex-col gap-2">
        <p className="px-2 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
          Main Ledger
        </p>

        <nav className="flex flex-col gap-1" aria-label="Main ledger">
          {navItems.map((item) => {
            const Icon = item.icon

            if (item.href) {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => toast.info(`${item.label} is coming soon.`)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto rounded-xl bg-sidebar-accent/70 p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-gold text-xs font-bold text-gold-foreground">
            BT
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              BizTrack Demo Store
            </p>
            <p className="truncate text-[0.7rem] text-sidebar-foreground/60">
              Kathmandu, Nepal
            </p>
          </div>
          <div className="flex flex-col text-sidebar-foreground/50">
            <ChevronUpIcon className="size-3" aria-hidden="true" />
            <ChevronDownIcon className="size-3" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-sidebar lg:flex lg:flex-col">
      <SidebarContent />
    </aside>
  )
}
