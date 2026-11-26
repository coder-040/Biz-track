"use client"

import { DownloadIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/inventory"

interface ExportButtonProps {
  products: Product[]
}

function escapeCell(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

export function ExportButton({ products }: ExportButtonProps) {
  function handleExport() {
    const header = [
      "Name",
      "SKU",
      "Category",
      "Cost price",
      "Selling price",
      "Current stock",
      "Minimum stock",
    ]

    const rows = products.map((product) => [
      product.name,
      product.sku,
      product.category,
      product.purchase_price,
      product.selling_price,
      product.current_stock,
      product.min_stock,
    ])

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `biztrack-inventory-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()

    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    toast.success("Inventory exported.")
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 rounded-xl bg-card"
      onClick={handleExport}
    >
      <DownloadIcon aria-hidden="true" />
      Export
    </Button>
  )
}
