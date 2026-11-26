"use client"

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface InventoryErrorStateProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function InventoryErrorState({
  error,
  reset,
}: InventoryErrorStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col justify-center gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            Inventory could not load
          </CardTitle>
          <CardDescription>
            Check that `.env.local` has the Supabase URL and anon key, and that
            the tables and `record_stock_movement` function from
            `supabase/schema.sql` have been applied in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            {error.message}
          </p>
          <div>
            <Button onClick={reset}>
              <RefreshCwIcon aria-hidden="true" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
