import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { customers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, Building2, User } from 'lucide-react'

export default async function CustomersPage() {
  const session = await auth()

  const rows = await db
    .select()
    .from(customers)
    .where(and(
      eq(customers.companyId, session!.user.companyId),
      eq(customers.isActive, true)
    ))
    .orderBy(customers.name)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kunden</h1>
          <p className="text-gray-400 text-sm mt-1">{rows.length} Kunden gesamt</p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Neuer Kunde
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Noch keine Kunden angelegt.</p>
          <Link href="/customers/new" className="text-blue-400 text-sm hover:underline mt-2 inline-block">
            Ersten Kunden erstellen
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-4 py-3 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                {customer.type === 'business' ? (
                  <Building2 size={16} className="text-gray-400" />
                ) : (
                  <User size={16} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{customer.name}</p>
                <p className="text-gray-500 text-xs truncate">
                  {customer.contactName || customer.email || customer.phone || '—'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {customer.addressCity && (
                  <p className="text-gray-500 text-xs">{customer.addressCity}</p>
                )}
                <p className="text-gray-600 text-xs">
                  {customer.type === 'business' ? 'Firma' : 'Privat'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
