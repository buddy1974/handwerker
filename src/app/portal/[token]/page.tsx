import { db } from '@/lib/db'
import { projects, customers, invoices } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export default async function CustomerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const [customer] = await db.select().from(customers).where(eq(customers.id, token))
  if (!customer) notFound()

  const customerProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.customerId, customer.id))
    .orderBy(projects.createdAt)

  const customerInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.customerId, customer.id))
    .orderBy(invoices.createdAt)

  const statusLabel: Record<string, string> = {
    draft: 'In Bearbeitung', active: 'Aktiv', paused: 'Pausiert',
    completed: 'Abgeschlossen', cancelled: 'Abgebrochen',
  }

  const invStatusLabel: Record<string, string> = {
    draft: 'Ausstehend', sent: 'Versendet', paid: 'Bezahlt',
    overdue: 'Überfällig', cancelled: 'Storniert',
  }

  const invStatusColor: Record<string, string> = {
    draft: 'text-gray-400', sent: 'text-blue-400',
    paid: 'text-green-400', overdue: 'text-red-400', cancelled: 'text-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Kundenportal</p>
            <h1 className="text-white font-bold text-lg">HandwerkOS</h1>
          </div>
          <div className="text-right">
            <p className="text-white font-medium">{customer.name}</p>
            {customer.email && <p className="text-gray-400 text-xs">{customer.email}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Ihre Projekte</h2>
          {customerProjects.length === 0 ? (
            <p className="text-gray-500 text-sm">Keine Projekte</p>
          ) : (
            <div className="space-y-3">
              {customerProjects.map(p => (
                <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{p.title}</p>
                      <p className="text-gray-500 text-xs mt-1">{p.projectNumber}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
                      {statusLabel[p.status ?? 'draft']}
                    </span>
                  </div>
                  {(p.startDate || p.endDate) && (
                    <p className="text-gray-500 text-xs mt-2">
                      {p.startDate} {p.endDate ? `→ ${p.endDate}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Ihre Rechnungen</h2>
          {customerInvoices.length === 0 ? (
            <p className="text-gray-500 text-sm">Keine Rechnungen</p>
          ) : (
            <div className="space-y-3">
              {customerInvoices.map(inv => (
                <div key={inv.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{inv.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{inv.invoiceNumber} · {inv.issueDate}</p>
                    {inv.dueDate && <p className="text-gray-500 text-xs">Fällig: {inv.dueDate}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number(inv.total))}
                    </p>
                    <p className={`text-xs mt-1 ${invStatusColor[inv.status ?? 'draft']}`}>
                      {invStatusLabel[inv.status ?? 'draft']}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs pt-4 border-t border-gray-800">
          Powered by <a href="https://maxpromo.digital" className="hover:text-gray-400">maxpromo.digital</a>
        </p>

      </main>
    </div>
  )
}
