import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { serviceReports, projects, reportChecklistItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Square, User, Calendar, Wrench } from 'lucide-react'

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const [report] = await db
    .select()
    .from(serviceReports)
    .where(and(
      eq(serviceReports.id, id),
      eq(serviceReports.companyId, session!.user.companyId)
    ))

  if (!report) notFound()

  const [projectData] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, report.projectId))

  const checklist = await db
    .select()
    .from(reportChecklistItems)
    .where(eq(reportChecklistItems.reportId, id))
    .orderBy(reportChecklistItems.sortOrder)

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-800 text-gray-400',
    submitted: 'bg-blue-950 text-blue-400',
    approved: 'bg-green-950 text-green-400',
  }

  const statusLabel: Record<string, string> = {
    draft: 'Entwurf',
    submitted: 'Eingereicht',
    approved: 'Genehmigt',
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reports" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-500 text-xs font-mono">{report.reportNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[report.status ?? 'draft']}`}>
              {statusLabel[report.status ?? 'draft']}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white truncate">{report.title}</h1>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Details</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Calendar size={14} className="text-gray-500" />
              <span className="text-white text-sm">{report.workDate}</span>
            </div>
            {projectData && (
              <div className="flex items-center gap-3">
                <Wrench size={14} className="text-gray-500" />
                <Link href={`/projects/${projectData.id}`} className="text-blue-400 text-sm hover:underline">
                  {projectData.projectNumber} — {projectData.title}
                </Link>
              </div>
            )}
            {report.customerName && (
              <div className="flex items-center gap-3">
                <User size={14} className="text-gray-500" />
                <span className="text-white text-sm">{report.customerName}</span>
              </div>
            )}
          </div>
        </div>

        {report.workDone && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Durchgeführte Arbeiten</h2>
            <p className="text-white text-sm whitespace-pre-wrap">{report.workDone}</p>
          </div>
        )}

        {report.materialsUsed && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Materialien</h2>
            <p className="text-white text-sm whitespace-pre-wrap">{report.materialsUsed}</p>
          </div>
        )}

        {checklist.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Checkliste</h2>
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.isChecked
                    ? <CheckSquare size={16} className="text-green-400 flex-shrink-0" />
                    : <Square size={16} className="text-gray-600 flex-shrink-0" />
                  }
                  <span className={`text-sm ${item.isChecked ? 'text-white' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.signaturePath && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Unterschrift {report.signedAt && <span className="text-green-400 normal-case ml-2">✓ {new Date(report.signedAt).toLocaleDateString('de-DE')}</span>}
            </h2>
            <img src={report.signaturePath} alt="Unterschrift" className="max-h-24 border border-gray-700 rounded-lg bg-white" />
          </div>
        )}

        {report.nextSteps && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Nächste Schritte</h2>
            <p className="text-white text-sm whitespace-pre-wrap">{report.nextSteps}</p>
          </div>
        )}
      </div>
    </div>
  )
}
