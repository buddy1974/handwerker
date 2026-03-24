import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { serviceReports, projects } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'

const statusLabel: Record<string, string> = {
  draft: 'Entwurf',
  submitted: 'Eingereicht',
  approved: 'Genehmigt',
}

const statusColor: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  submitted: 'bg-blue-950 text-blue-400',
  approved: 'bg-green-950 text-green-400',
}

export default async function ReportsPage() {
  const session = await auth()

  const rows = await db
    .select({
      id: serviceReports.id,
      title: serviceReports.title,
      status: serviceReports.status,
      workDate: serviceReports.workDate,
      reportNumber: serviceReports.reportNumber,
      signedAt: serviceReports.signedAt,
      project: {
        id: projects.id,
        title: projects.title,
      },
    })
    .from(serviceReports)
    .leftJoin(projects, eq(serviceReports.projectId, projects.id))
    .where(eq(serviceReports.companyId, session!.user.companyId))
    .orderBy(desc(serviceReports.createdAt))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Berichte</h1>
          <p className="text-gray-400 text-sm mt-1">{rows.length} Berichte gesamt</p>
        </div>
        <Link
          href="/reports/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Neuer Bericht
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Noch keine Berichte erstellt.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map(report => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-4 py-3 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500 text-xs font-mono">{report.reportNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[report.status ?? 'draft']}`}>
                    {statusLabel[report.status ?? 'draft']}
                  </span>
                  {report.signedAt && <span className="text-xs text-green-400">✓ Unterschrift</span>}
                </div>
                <p className="text-white font-medium text-sm truncate">{report.title}</p>
                <p className="text-gray-500 text-xs truncate">{report.project?.title}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-gray-500 text-xs">{report.workDate}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
