export function calcLineTotal(quantity: string, unitPrice: string, discountPct: string, itemType?: 'unit' | 'flat'): number {
  if (itemType === 'flat') return Math.round((parseFloat(unitPrice) || 0) * 100) / 100
  const qty = parseFloat(quantity) || 0
  const price = parseFloat(unitPrice) || 0
  const disc = parseFloat(discountPct) || 0
  return Math.round(qty * price * (1 - disc / 100) * 100) / 100
}

export function calcTotals(items: { quantity: string; unitPrice: string; discountPct: string; taxRate: string; itemType?: 'unit' | 'flat' }[]) {
  let subtotal = 0
  let taxAmount = 0

  for (const item of items) {
    const lineTotal = calcLineTotal(item.quantity, item.unitPrice, item.discountPct, item.itemType)
    subtotal += lineTotal
    taxAmount += Math.round(lineTotal * (parseFloat(item.taxRate) / 100) * 100) / 100
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  }
}

export function formatCurrency(amount: number, locale: 'de' | 'en' = 'de'): string {
  if (locale === 'en') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatEur(amount: number | string): string {
  return formatCurrency(Number(amount), 'de')
}

export function formatDate(dateStr: string, locale: 'de' | 'en' = 'de'): string {
  const date = new Date(dateStr)
  if (locale === 'en') {
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  }
  return date.toLocaleDateString('de-DE')
}

export function currencySymbol(locale: 'de' | 'en'): string {
  return locale === 'en' ? '$' : '€'
}

export function taxLabel(locale: 'de' | 'en'): string {
  return locale === 'en' ? 'Tax' : 'MwSt.'
}
