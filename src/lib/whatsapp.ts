import { formatCurrency } from './utils/money'
import type { Locale } from './i18n'

export function buildInvoiceWhatsApp(
  invoice: {
    invoiceNumber: string | null
    total: string | number | null
    depositAmount?: string | number | null
    dueDate?: string | null
    items: { title: string; lineTotal: string | number | null }[]
  },
  customer: { name: string },
  bankInfo: { iban?: string | null; bic?: string | null },
  locale: Locale,
): string {
  const cur = (n: string | number | null) => formatCurrency(Number(n ?? 0), locale)
  const total = Number(invoice.total ?? 0)
  const deposit = Number(invoice.depositAmount ?? 0)
  const balance = total - deposit

  const itemLines = invoice.items.map(item => `• ${item.title}: ${cur(item.lineTotal)}`).join('\n')

  const depositLine = deposit > 0
    ? `\n${locale === 'en' ? 'Deposit received' : 'Anzahlung erhalten'}: -${cur(deposit)}\n${locale === 'en' ? 'Balance due' : 'Restbetrag'}: ${cur(balance)}`
    : ''

  const msg = locale === 'en'
    ? `Hi ${customer.name},\n\nPlease find your invoice ${invoice.invoiceNumber ?? ''} below:\n\n${itemLines}\n\nTotal: ${cur(total)}${depositLine}\n\nDue: ${invoice.dueDate ?? ''}\nAccount: ${bankInfo.iban ?? ''}\nRouting: ${bankInfo.bic ?? ''}\n\nPDF attached. Thank you!`
    : `Hallo ${customer.name},\n\nIhre Rechnung ${invoice.invoiceNumber ?? ''}:\n\n${itemLines}\n\nGesamt: ${cur(total)}${depositLine}\n\nFällig: ${invoice.dueDate ?? ''}\nIBAN: ${bankInfo.iban ?? ''}\nBIC: ${bankInfo.bic ?? ''}\n\nPDF im Anhang. Vielen Dank!`

  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}

export function buildOfferWhatsApp(
  offer: {
    offerNumber: string | null
    total: string | number | null
    validUntil?: string | null
    items: { title: string; lineTotal: string | number | null }[]
  },
  customer: { name: string },
  locale: Locale,
): string {
  const cur = (n: string | number | null) => formatCurrency(Number(n ?? 0), locale)

  const itemLines = offer.items.map(item => `• ${item.title}: ${cur(item.lineTotal)}`).join('\n')

  const msg = locale === 'en'
    ? `Hi ${customer.name},\n\nYour quote ${offer.offerNumber ?? ''}:\n\n${itemLines}\n\nTotal: ${cur(offer.total)}\nValid until: ${offer.validUntil ?? ''}\n\nPDF attached. Let us know if you have questions!`
    : `Hallo ${customer.name},\n\nIhr Angebot ${offer.offerNumber ?? ''}:\n\n${itemLines}\n\nGesamt: ${cur(offer.total)}\nGültig bis: ${offer.validUntil ?? ''}\n\nPDF im Anhang. Bei Fragen stehen wir gerne zur Verfügung!`

  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}
