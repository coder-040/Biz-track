"use client"

import { useSyncExternalStore } from "react"

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kathmandu",
})

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return `${dateFormatter.format(new Date())} · NPT`
}

function getServerSnapshot() {
  return "Today · NPT"
}

export function TodayDate() {
  const label = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return <span suppressHydrationWarning>{label}</span>
}
