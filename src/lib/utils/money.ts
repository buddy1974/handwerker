export function calcLineTotal(quantity: string, unitPrice: string, discountPct: string): number {
  const qty = parseFloat(quantity) || 0
  const price = parseFloat(unitPrice) || 0
  const disc = parseFloat(discountPct) || 0
  return Math.round(qty * price * (1 - disc / 100) * 100) / 100
}

export function calcTotals(items: { quantity: string; unitPrice: string; discountPct: string; taxRate: string }[]) {
  let subtotal = 0
  let taxAmount = 0

  for (const item of items) {
    const lineTotal = calcLineTotal(item.quantity, item.unitPrice, item.discountPct)
    subtotal += lineTotal
    taxAmount += Math.round(lineTotal * (parseFloat(item.taxRate) / 100) * 100) / 100
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  }
}

export function formatEur(amount: number | string): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number(amount))
}
