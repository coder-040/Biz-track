const numberFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

const quantityFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 3,
})

export function formatCurrency(value: number): string {
  return `Rs. ${numberFormatter.format(value)}`
}

export function formatCompactCurrency(value: number): string {
  return `Rs ${compactCurrencyFormatter.format(value)}`
}

export function formatQuantity(value: number): string {
  return quantityFormatter.format(value)
}

export function formatMovementDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
