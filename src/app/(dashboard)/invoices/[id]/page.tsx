import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems, customers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileDown } from 'lucide-react'
import { formatEur } from '@/lib/utils/money'
import MarkPaidButton from './MarkPaidButton'

const statusLabel: Record<string, string> = {
  draft: 'Entwurf', sent: 'Versendet', paid: 'Bezahlt', overdue: 'Überfällig', cancelled: 'Storniert',
}
const statusColor: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  sent: 'bg-blue-950 text-blue-400',
  paid: 'bg-green-950 text-green-400',
  overdue: 'bg-red-950 text-red-400',
  cancelled: 'bg-gray-800 text-gray-500',
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.companyId, session!.user.companyId)))
  if (!invoice) notFound()

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(invoiceItems.sortOrder)
  const [customer] = await db.select().from(customers).where(eq(customers.id, invoice.customerId))

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-500 text-xs font-mono">{invoice.invoiceNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[invoice.status ?? 'draft']}`}>{statusLabel[invoice.status ?? 'draft']}</span>
          </div>
          <h1 className="text-xl font-bold text-white truncate">{invoice.title}</h1>
        </div>
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
        >
          <FileDown size={14} />
          PDF
        </a>
        {invoice.status !== 'paid' && (
          <MarkPaidButton invoiceId={invoice.id} />
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Details</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Kunde</span><span className="text-white">{customer?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Datum</span><span className="text-white">{invoice.issueDate}</span></div>
            {invoice.dueDate && <div className="flex justify-between"><span className="text-gray-400">Fällig</span><span className="text-white">{invoice.dueDate}</span></div>}
            {invoice.paidAt && <div className="flex justify-between"><span className="text-gray-400">Bezahlt am</span><span className="text-green-400">{new Date(invoice.paidAt).toLocaleDateString('de-DE')}</span></div>}
            {invoice.paymentTerms && <div className="flex justify-between"><span className="text-gray-400">Zahlungsbedingung</span><span className="text-white">{invoice.paymentTerms}</span></div>}
            {invoice.iban && <div className="flex justify-between"><span className="text-gray-400">IBAN</span><span className="text-white font-mono text-xs">{invoice.iban}</span></div>}
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Positionen</h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={item.id} className="flex items-start justify-between gap-4 pb-3 border-b border-gray-800 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{i + 1}. {item.title}</p>
                    {item.description && <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>}
                    <p className="text-gray-400 text-xs mt-1">{item.quantity} {item.unit} × {formatEur(Number(item.unitPrice))}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white text-sm font-medium">{formatEur(Number(item.lineTotal))}</p>
                    <p className="text-gray-500 text-xs">MwSt {item.taxRate}%</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-gray-800 pt-4">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Netto</span><span className="text-white">{formatEur(Number(invoice.subtotal))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">MwSt</span><span className="text-white">{formatEur(Number(invoice.taxAmount))}</span></div>
              <div className="flex justify-between text-sm font-bold pt-1"><span className="text-white">Gesamt</span><span className="text-blue-400 text-base">{formatEur(Number(invoice.total))}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
