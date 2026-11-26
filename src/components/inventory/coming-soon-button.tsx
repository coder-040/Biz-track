"use client"

import type { ReactNode } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

interface ComingSoonButtonProps {
  label: string
  icon: ReactNode
}

export function ComingSoonButton({ label, icon }: ComingSoonButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 rounded-xl bg-card"
      onClick={() => toast.info(`${label} is coming soon.`)}
    >
      {icon}
      {label}
    </Button>
  )
}
