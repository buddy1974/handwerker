import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, customers, timeEntries } from '@/lib/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'
import Link from 'next/link'
import { FolderOpen, Users, Clock, ArrowRight } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

export default async function DashboardPage() {
  const session = await auth()
  const companyId = session!.user.companyId
  const locale = (session?.user?.locale ?? 'de') as Locale

  const [
    projectCount,
    activeProjectCount,
    customerCount,
    timeToday,
  ] = await Promise.all([
    db.select({ count: count() }).from(projects)
      .where(eq(projects.companyId, companyId))
      .then(r => r[0].count),

    db.select({ count: count() }).from(projects)
      .where(and(
        eq(projects.companyId, companyId),
        eq(projects.status, 'active')
      ))
      .then(r => r[0].count),

    db.select({ count: count() }).from(customers)
      .where(and(
        eq(customers.companyId, companyId),
        eq(customers.isActive, true)
      ))
      .then(r => r[0].count),

    db.select({
      total: sql<number>`coalesce(sum(${timeEntries.durationMin}), 0)`
    })
      .from(timeEntries)
      .where(and(
        eq(timeEntries.companyId, companyId),
        sql`DATE(${timeEntries.startedAt}) = CURRENT_DATE`
      ))
      .then(r => r[0].total),
  ])

  const recentProjects = await db
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      projectNumber: projects.projectNumber,
    })
    .from(projects)
    .where(eq(projects.companyId, companyId))
    .orderBy(sql`${projects.createdAt} DESC`)
    .limit(5)

  const hours = Math.floor(Number(timeToday) / 60)
  const minutes = Number(timeToday) % 60

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-800 text-gray-400',
    active: 'bg-green-950 text-green-400',
    paused: 'bg-yellow-950 text-yellow-400',
    completed: 'bg-blue-950 text-blue-400',
    cancelled: 'bg-red-950 text-red-400',
  }

  const statusLabel: Record<string, string> = locale === 'en' ? {
    draft: 'Draft', active: 'Active', paused: 'Paused',
    completed: 'Completed', cancelled: 'Cancelled',
  } : {
    draft: 'Entwurf', active: 'Aktiv', paused: 'Pausiert',
    completed: 'Abgeschlossen', cancelled: 'Storniert',
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <a href="/dashboard/analytics" className="text-blue-400 text-sm hover:underline flex items-center gap-1">
          {locale === 'en' ? 'Analytics →' : 'Auswertungen →'}
        </a>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {locale === 'en' ? 'Good day' : 'Guten Tag'}, {session!.user.firstName} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">{locale === 'en' ? 'Welcome to HandwerkOS' : 'Willkommen in HandwerkOS'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">{t(locale, 'projects')}</span>
            <FolderOpen size={16} className="text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-white">{projectCount}</p>
          <p className="text-green-400 text-xs mt-1">{activeProjectCount} {locale === 'en' ? 'active' : 'aktiv'}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">{t(locale, 'customers')}</span>
            <Users size={16} className="text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-white">{customerCount}</p>
          <p className="text-gray-500 text-xs mt-1">{locale === 'en' ? 'total' : 'gesamt'}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">{locale === 'en' ? 'Worked today' : 'Heute gearbeitet'}</span>
            <Clock size={16} className="text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-white">{hours}h {minutes}m</p>
          <p className="text-gray-500 text-xs mt-1">{t(locale, 'timeTracking')}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white">{locale === 'en' ? 'Recent Projects' : 'Letzte Projekte'}</h2>
          <Link href="/projects" className="text-blue-400 text-xs hover:underline flex items-center gap-1">
            {locale === 'en' ? 'View all' : 'Alle anzeigen'} <ArrowRight size={12} />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <p className="text-gray-500 text-sm">{locale === 'en' ? 'No projects yet.' : 'Noch keine Projekte.'}</p>
        ) : (
          <div className="space-y-2">
            {recentProjects.map(p => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-500 text-xs font-mono w-24 flex-shrink-0">{p.projectNumber}</span>
                <span className="text-white text-sm flex-1 truncate">{p.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[p.status ?? 'draft']}`}>
                  {statusLabel[p.status ?? 'draft']}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
