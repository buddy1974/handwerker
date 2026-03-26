import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, customers } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, FolderOpen } from 'lucide-react'

const statusLabel: Record<string, string> = {
  draft: 'Entwurf',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  cancelled: 'Abgebrochen',
}

const statusColor: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  active: 'bg-green-950 text-green-400',
  paused: 'bg-yellow-950 text-yellow-400',
  completed: 'bg-blue-950 text-blue-400',
  cancelled: 'bg-red-950 text-red-400',
}

const priorityLabel: Record<number, string> = {
  1: 'Niedrig',
  2: 'Normal',
  3: 'Hoch',
}

const priorityColor: Record<number, string> = {
  1: 'text-gray-500',
  2: 'text-gray-400',
  3: 'text-orange-400',
}

export default async function ProjectsPage() {
  const session = await auth()

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      priority: projects.priority,
      projectNumber: projects.projectNumber,
      locationCity: projects.locationCity,
      startDate: projects.startDate,
      recurringInterval: projects.recurringInterval,
      warrantyEndDate: projects.warrantyEndDate,
      createdAt: projects.createdAt,
      customer: {
        id: customers.id,
        name: customers.name,
      },
    })
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id))
    .where(eq(projects.companyId, session!.user.companyId))
    .orderBy(desc(projects.createdAt))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projekte</h1>
          <p className="text-gray-400 text-sm mt-1">{rows.length} Projekte gesamt</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Neues Projekt
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Noch keine Projekte angelegt.</p>
          <Link href="/projects/new" className="text-blue-400 text-sm hover:underline mt-2 inline-block">
            Erstes Projekt erstellen
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-4 py-3 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500 text-xs font-mono">{project.projectNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[project.status ?? 'draft']}`}>
                    {statusLabel[project.status ?? 'draft']}
                  </span>
                  {project.recurringInterval && (
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                      🔄 {project.recurringInterval === 'monthly' ? 'Monatlich'
                        : project.recurringInterval === 'quarterly' ? 'Vierteljährlich'
                        : 'Jährlich'}
                    </span>
                  )}
                  {project.warrantyEndDate && new Date(project.warrantyEndDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      new Date(project.warrantyEndDate) < new Date()
                        ? 'bg-red-900 text-red-300'
                        : 'bg-amber-900 text-amber-300'
                    }`}>
                      🛡️ {new Date(project.warrantyEndDate) < new Date() ? 'Abgelaufen' : 'Läuft bald ab'}
                    </span>
                  )}
                </div>
                <p className="text-white font-medium text-sm truncate">{project.title}</p>
                <p className="text-gray-500 text-xs truncate">{project.customer?.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {project.locationCity && (
                  <p className="text-gray-500 text-xs">{project.locationCity}</p>
                )}
                <p className={`text-xs ${priorityColor[project.priority ?? 2]}`}>
                  {priorityLabel[project.priority ?? 2]}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
