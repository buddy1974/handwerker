import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, customers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Clock, Pencil, User2, Plus } from 'lucide-react'
import ProjectChat from '@/components/project/ProjectChat'
import MaterialLog from '@/components/project/MaterialLog'
import TravelLog from '@/components/project/TravelLog'

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

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const rows = await db
    .select({
      project: projects,
      customer: {
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
      },
    })
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id))
    .where(and(
      eq(projects.id, id),
      eq(projects.companyId, session!.user.companyId)
    ))

  if (!rows.length) notFound()

  const { project, customer } = rows[0]

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-500 text-xs font-mono">{project.projectNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[project.status ?? 'draft']}`}>
              {statusLabel[project.status ?? 'draft']}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white truncate">{project.title}</h1>
        </div>
        <Link
          href={`/projects/${project.id}/nachtragsauftrag`}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0"
        >
          <Plus size={14} />
          Nachtrag
        </Link>
        <Link
          href={`/projects/${project.id}/edit`}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0"
        >
          <Pencil size={14} />
          Bearbeiten
        </Link>
      </div>

      <div className="space-y-4">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Kunde</h2>
          <div className="flex items-center gap-3">
            <User2 size={15} className="text-gray-500 flex-shrink-0" />
            <Link
              href={`/customers/${customer?.id}`}
              className="text-blue-400 text-sm hover:underline"
            >
              {customer?.name}
            </Link>
          </div>
          {customer?.email && (
            <div className="mt-2 ml-6">
              <a href={`mailto:${customer.email}`} className="text-gray-500 text-xs hover:text-gray-300">
                {customer.email}
              </a>
            </div>
          )}
        </div>

        {(project.locationStreet || project.locationCity) && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Einsatzort</h2>
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white">
                {project.locationName && <p className="text-gray-400 text-xs mb-1">{project.locationName}</p>}
                {project.locationStreet && <p>{project.locationStreet}</p>}
                {(project.locationZip || project.locationCity) && (
                  <p>{[project.locationZip, project.locationCity].filter(Boolean).join(' ')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Details</h2>
          <div className="space-y-3">
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-3">
                <Calendar size={15} className="text-gray-500 flex-shrink-0" />
                <span className="text-white text-sm">
                  {project.startDate && <span>{project.startDate}</span>}
                  {project.startDate && project.endDate && <span className="text-gray-500"> → </span>}
                  {project.endDate && <span>{project.endDate}</span>}
                </span>
              </div>
            )}
            {project.estimatedHours && (
              <div className="flex items-center gap-3">
                <Clock size={15} className="text-gray-500 flex-shrink-0" />
                <span className="text-white text-sm">{project.estimatedHours} Stunden geschätzt</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs w-4 text-center">!</span>
              <span className="text-white text-sm">
                Priorität: {priorityLabel[project.priority ?? 2]}
              </span>
            </div>
          </div>
        </div>

        {project.recurringInterval && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-300 font-medium mb-1">
              🔄 Wartungsvertrag aktiv
            </div>
            <p className="text-sm text-blue-400">
              Nächste Rechnung:{' '}
              {project.recurringNextDate
                ? new Date(project.recurringNextDate).toLocaleDateString('de-DE')
                : '—'}
            </p>
            {project.recurringEndDate && (
              <p className="text-sm text-blue-400">
                Vertragsende: {new Date(project.recurringEndDate).toLocaleDateString('de-DE')}
              </p>
            )}
          </div>
        )}

        {project.description && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Beschreibung</h2>
            <p className="text-white text-sm whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        <MaterialLog projectId={project.id} />
        <TravelLog projectId={project.id} />
        <ProjectChat projectId={project.id} currentUserId={session!.user.id} />

      </div>
    </div>
  )
}
