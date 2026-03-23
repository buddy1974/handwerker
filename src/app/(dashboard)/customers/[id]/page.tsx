import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { customers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, FileText, Pencil } from 'lucide-react'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(
      eq(customers.id, id),
      eq(customers.companyId, session!.user.companyId)
    ))

  if (!customer) notFound()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/customers" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
          <p className="text-gray-400 text-sm">
            {customer.type === 'business' ? 'Firma' : 'Privatkunde'}
          </p>
        </div>
        <Link
          href={`/customers/${customer.id}/edit`}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Pencil size={14} />
          Bearbeiten
        </Link>
      </div>

      <div className="space-y-4">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Kontakt</h2>
          <div className="space-y-3">
            {customer.contactName && (
              <div className="flex items-center gap-3">
                <User size={15} className="text-gray-500 flex-shrink-0" />
                <span className="text-white text-sm">{customer.contactName}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail size={15} className="text-gray-500 flex-shrink-0" />
                <a href={`mailto:${customer.email}`} className="text-blue-400 text-sm hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone size={15} className="text-gray-500 flex-shrink-0" />
                <a href={`tel:${customer.phone}`} className="text-blue-400 text-sm hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}
            {!customer.contactName && !customer.email && !customer.phone && (
              <p className="text-gray-500 text-sm">Keine Kontaktdaten</p>
            )}
          </div>
        </div>

        {(customer.addressStreet || customer.addressCity) && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Adresse</h2>
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white">
                {customer.addressStreet && <p>{customer.addressStreet}</p>}
                {(customer.addressZip || customer.addressCity) && (
                  <p>{[customer.addressZip, customer.addressCity].filter(Boolean).join(' ')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {customer.notes && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Notizen</h2>
            <div className="flex items-start gap-3">
              <FileText size={15} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-white text-sm whitespace-pre-wrap">{customer.notes}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Projekte</h2>
          <p className="text-gray-500 text-sm">Noch keine Projekte. Kommt in Phase 2.</p>
        </div>

      </div>
    </div>
  )
}
