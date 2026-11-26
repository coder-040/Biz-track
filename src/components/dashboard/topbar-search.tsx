"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

export function TopbarSearch() {
  const router = useRouter()
  const [value, setValue] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = value.trim()

    router.push(
      query ? `/inventory?q=${encodeURIComponent(query)}` : "/inventory"
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl" role="search">
      <SearchIcon
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search bills, items, udharo party..."
        aria-label="Search inventory"
        className="h-10 rounded-xl border-border/70 bg-card pl-9 shadow-sm"
      />
    </form>
  )
}
