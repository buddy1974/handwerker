import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, customers, timeEntries } from '@/lib/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'
import Link from 'next/link'
import { FolderOpen, Users, Clock, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const companyId = session!.user.companyId

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

  const statusLabel: Record<string, string> = {
    draft: 'Entwurf',
    active: 'Aktiv',
    paused: 'Pausiert',
    completed: 'Abgeschlossen',
    cancelled: 'Abgebrochen',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Guten Tag, {session!.user.firstName} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">Willkommen in HandwerkOS</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Projekte</span>
            <FolderOpen size={16} className="text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-white">{projectCount}</p>
          <p className="text-green-400 text-xs mt-1">{activeProjectCount} aktiv</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Kunden</span>
            <Users size={16} className="text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-white">{customerCount}</p>
          <p className="text-gray-500 text-xs mt-1">gesamt</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Heute gearbeitet</span>
            <Clock size={16} className="text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-white">{hours}h {minutes}m</p>
          <p className="text-gray-500 text-xs mt-1">Zeiterfassung</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white">Letzte Projekte</h2>
          <Link href="/projects" className="text-blue-400 text-xs hover:underline flex items-center gap-1">
            Alle anzeigen <ArrowRight size={12} />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <p className="text-gray-500 text-sm">Noch keine Projekte.</p>
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
