import Link from "next/link"
import { PackageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatQuantity } from "@/lib/format"
import {
  calculateInventoryValue,
  isLowStock,
  type Product,
} from "@/lib/inventory"
import { cn } from "@/lib/utils"

interface ProductTableProps {
  products: Product[]
  supplierNames: Record<string, string>
  emptyTitle: string
  emptyDescription: string
  archived?: boolean
}

export function ProductTable({
  products,
  supplierNames,
  emptyTitle,
  emptyDescription,
  archived = false,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
        <PackageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">{emptyTitle}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {emptyDescription}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Minimum</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const lowStock = isLowStock(
            product.current_stock,
            product.min_stock,
            product.is_active
          )

          return (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{product.name}</span>
                  {product.sku ? (
                    <span className="text-xs text-muted-foreground">
                      {product.sku}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{product.category ?? "—"}</TableCell>
              <TableCell>{formatQuantity(product.current_stock)}</TableCell>
              <TableCell>{formatQuantity(product.min_stock)}</TableCell>
              <TableCell>
                {formatCurrency(
                  calculateInventoryValue(
                    product.current_stock,
                    product.purchase_price
                  )
                )}
              </TableCell>
              <TableCell>
                {product.supplier_id
                  ? (supplierNames[product.supplier_id] ?? "—")
                  : "—"}
              </TableCell>
              <TableCell>
                {archived ? (
                  <Badge variant="outline">Archived</Badge>
                ) : lowStock ? (
                  <Badge variant="destructive">Low stock</Badge>
                ) : (
                  <Badge variant="secondary">In stock</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/inventory/${product.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" })
                  )}
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
