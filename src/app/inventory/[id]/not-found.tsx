import Link from "next/link"
import { PackageXIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function ProductNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col justify-center gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageXIcon
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
            Product not found
          </CardTitle>
          <CardDescription>
            The product may have been removed, or the link is incorrect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/inventory"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to inventory
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
