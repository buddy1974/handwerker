import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, invoices, customers, serviceReports } from '@/lib/db/schema'
import { eq, count, sql, and } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, FileText } from 'lucide-react'
import { formatEur } from '@/lib/utils/money'

export default async function AnalyticsPage() {
  const session = await auth()
  const companyId = session!.user.companyId

  const [
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    projectStats,
    customerCount,
    reportCount,
    topCustomers,
    recentInvoices,
  ] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(cast(${invoices.total} as numeric)), 0)` })
      .from(invoices).where(eq(invoices.companyId, companyId))
      .then(r => r[0].total),

    db.select({ total: sql<number>`coalesce(sum(cast(${invoices.total} as numeric)), 0)` })
      .from(invoices).where(and(eq(invoices.companyId, companyId), eq(invoices.status, 'paid')))
      .then(r => r[0].total),

    db.select({ total: sql<number>`coalesce(sum(cast(${invoices.total} as numeric)), 0)` })
      .from(invoices).where(and(eq(invoices.companyId, companyId), eq(invoices.status, 'sent')))
      .then(r => r[0].total),

    db.select({
      total: count(),
      active: sql<number>`count(*) filter (where ${projects.status} = 'active')`,
      completed: sql<number>`count(*) filter (where ${projects.status} = 'completed')`,
    }).from(projects).where(eq(projects.companyId, companyId))
      .then(r => r[0]),

    db.select({ count: count() }).from(customers)
      .where(eq(customers.companyId, companyId))
      .then(r => r[0].count),

    db.select({ count: count() }).from(serviceReports)
      .where(eq(serviceReports.companyId, companyId))
      .then(r => r[0].count),

    db.select({
      customerId: invoices.customerId,
      name: customers.name,
      total: sql<number>`sum(cast(${invoices.total} as numeric))`,
      count: count(),
    })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.companyId, companyId))
      .groupBy(invoices.customerId, customers.name)
      .orderBy(sql`sum(cast(${invoices.total} as numeric)) desc`)
      .limit(5),

    db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      total: invoices.total,
      status: invoices.status,
      issueDate: invoices.issueDate,
      customerName: customers.name,
    })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.companyId, companyId))
      .orderBy(sql`${invoices.createdAt} desc`)
      .limit(10),
  ])

  const statusColor: Record<string, string> = {
    draft: 'text-gray-400', sent: 'text-blue-400',
    paid: 'text-green-400', overdue: 'text-red-400', cancelled: 'text-gray-500',
  }
  const statusLabel: Record<string, string> = {
    draft: 'Entwurf', sent: 'Versendet', paid: 'Bezahlt', overdue: 'Überfällig', cancelled: 'Storniert',
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Auswertungen</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Gesamtumsatz</span>
            <TrendingUp size={16} className="text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-white">{formatEur(totalRevenue)}</p>
          <p className="text-green-400 text-xs mt-1">{formatEur(paidRevenue)} bezahlt</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Offen</span>
            <TrendingUp size={16} className="text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-white">{formatEur(pendingRevenue)}</p>
          <p className="text-orange-400 text-xs mt-1">ausstehend</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Projekte</span>
            <FileText size={16} className="text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-white">{projectStats.total}</p>
          <p className="text-gray-500 text-xs mt-1">{Number(projectStats.active)} aktiv · {Number(projectStats.completed)} abgeschlossen</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Kunden</span>
            <Users size={16} className="text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-white">{customerCount}</p>
          <p className="text-gray-500 text-xs mt-1">{reportCount} Berichte</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Top Kunden</h2>
          {topCustomers.length === 0 ? (
            <p className="text-gray-500 text-sm">Noch keine Rechnungen</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((c, i) => (
                <div key={c.customerId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-xs w-5">{i + 1}.</span>
                    <span className="text-white text-sm">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{formatEur(c.total)}</p>
                    <p className="text-gray-500 text-xs">{c.count} Rechnungen</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Letzte Rechnungen</h2>
          <div className="space-y-2">
            {recentInvoices.map(inv => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}
                className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 hover:opacity-80">
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{inv.title}</p>
                  <p className="text-gray-500 text-xs">{inv.customerName} · {inv.issueDate}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-white text-sm">{formatEur(Number(inv.total))}</p>
                  <p className={`text-xs ${statusColor[inv.status ?? 'draft']}`}>{statusLabel[inv.status ?? 'draft']}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
