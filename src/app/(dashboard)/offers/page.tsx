import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { offers, customers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, FilePlus } from 'lucide-react'
import { formatEur } from '@/lib/utils/money'

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

export default async function OffersPage() {
  const session = await auth()

  const rows = await db
    .select({
      id: offers.id,
      offerNumber: offers.offerNumber,
      title: offers.title,
      status: offers.status,
      total: offers.total,
      issueDate: offers.issueDate,
      customer: { id: customers.id, name: customers.name },
    })
    .from(offers)
    .leftJoin(customers, eq(offers.customerId, customers.id))
    .where(eq(offers.companyId, session!.user.companyId))
    .orderBy(desc(offers.createdAt))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Angebote</h1>
          <p className="text-gray-400 text-sm mt-1">{rows.length} Angebote gesamt</p>
        </div>
        <Link href="/offers/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} />Neues Angebot
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FilePlus size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Noch keine Angebote erstellt.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map(offer => (
            <Link key={offer.id} href={`/offers/${offer.id}`} className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-4 py-3 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500 text-xs font-mono">{offer.offerNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[offer.status ?? 'draft']}`}>{statusLabel[offer.status ?? 'draft']}</span>
                </div>
                <p className="text-white font-medium text-sm truncate">{offer.title}</p>
                <p className="text-gray-500 text-xs">{offer.customer?.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white text-sm font-medium">{formatEur(Number(offer.total))}</p>
                <p className="text-gray-500 text-xs">{offer.issueDate}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
