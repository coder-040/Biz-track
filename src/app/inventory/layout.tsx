import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function InventoryLayout({ children }: LayoutProps<"/inventory">) {
  return <DashboardShell>{children}</DashboardShell>
}
