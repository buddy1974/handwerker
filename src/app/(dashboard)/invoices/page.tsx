import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, customers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'
import { formatEur } from '@/lib/utils/money'

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

export default async function InvoicesPage() {
  const session = await auth()

  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      status: invoices.status,
      total: invoices.total,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      customer: { id: customers.id, name: customers.name },
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.companyId, session!.user.companyId))
    .orderBy(desc(invoices.createdAt))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Rechnungen</h1>
          <p className="text-gray-400 text-sm mt-1">{rows.length} Rechnungen gesamt</p>
        </div>
        <Link href="/invoices/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} />Neue Rechnung
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Receipt size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Noch keine Rechnungen erstellt.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map(invoice => (
            <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-4 py-3 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500 text-xs font-mono">{invoice.invoiceNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[invoice.status ?? 'draft']}`}>{statusLabel[invoice.status ?? 'draft']}</span>
                  {invoice.paidAt && <span className="text-xs text-green-400">✓ Bezahlt</span>}
                </div>
                <p className="text-white font-medium text-sm truncate">{invoice.title}</p>
                <p className="text-gray-500 text-xs">{invoice.customer?.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white text-sm font-medium">{formatEur(Number(invoice.total))}</p>
                <p className="text-gray-500 text-xs">{invoice.dueDate ? `Fällig: ${invoice.dueDate}` : invoice.issueDate}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
