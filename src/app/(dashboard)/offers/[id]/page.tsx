import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { offers, offerItems, customers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileDown } from 'lucide-react'
import { formatEur } from '@/lib/utils/money'
import CreateInvoiceButton from './CreateInvoiceButton'
import SendEmailButton from './SendEmailButton'

const statusLabel: Record<string, string> = {
  draft: 'Entwurf', sent: 'Versendet', accepted: 'Angenommen', rejected: 'Abgelehnt', expired: 'Abgelaufen',
}
const statusColor: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  sent: 'bg-blue-950 text-blue-400',
  accepted: 'bg-green-950 text-green-400',
  rejected: 'bg-red-950 text-red-400',
  expired: 'bg-yellow-950 text-yellow-400',
}

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const [offer] = await db.select().from(offers).where(and(eq(offers.id, id), eq(offers.companyId, session!.user.companyId)))
  if (!offer) notFound()

  const items = await db.select().from(offerItems).where(eq(offerItems.offerId, id)).orderBy(offerItems.sortOrder)
  const [customer] = await db.select().from(customers).where(eq(customers.id, offer.customerId))

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/offers" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-500 text-xs font-mono">{offer.offerNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[offer.status ?? 'draft']}`}>{statusLabel[offer.status ?? 'draft']}</span>
          </div>
          <h1 className="text-xl font-bold text-white truncate">{offer.title}</h1>
        </div>
        <a
          href={`/api/offers/${offer.id}/pdf`}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
        >
          <FileDown size={14} />
          PDF
        </a>
        <SendEmailButton offerId={offer.id} defaultEmail={customer?.email ?? ''} />
        <CreateInvoiceButton offerId={offer.id} customerId={offer.customerId} projectId={offer.projectId ?? null} title={offer.title} items={items} />
      </div>

      <div className="space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Details</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Kunde</span><span className="text-white">{customer?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Datum</span><span className="text-white">{offer.issueDate}</span></div>
            {offer.validUntil && <div className="flex justify-between"><span className="text-gray-400">Gültig bis</span><span className="text-white">{offer.validUntil}</span></div>}
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
              <div className="flex justify-between text-sm"><span className="text-gray-400">Netto</span><span className="text-white">{formatEur(Number(offer.subtotal))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">MwSt</span><span className="text-white">{formatEur(Number(offer.taxAmount))}</span></div>
              <div className="flex justify-between text-sm font-bold pt-1"><span className="text-white">Gesamt</span><span className="text-blue-400 text-base">{formatEur(Number(offer.total))}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
