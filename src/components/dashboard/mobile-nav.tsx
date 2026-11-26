"use client"

import { useState } from "react"
import { MenuIcon, XIcon } from "lucide-react"

import { SidebarContent } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon aria-hidden="true" />
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar shadow-2xl">
            <div className="flex items-center justify-end p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                <XIcon aria-hidden="true" />
              </Button>
            </div>
            <div className="h-[calc(100%-3rem)] overflow-y-auto">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
