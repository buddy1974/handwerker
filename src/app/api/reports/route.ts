import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { serviceReports, projects, reportChecklistItems, users } from '@/lib/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { createReportSchema } from '@/lib/validations/report'
import { sendPushToUser } from '@/lib/push'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  const conditions = [eq(serviceReports.companyId, session.user.companyId)]
  if (projectId) conditions.push(eq(serviceReports.projectId, projectId))

  const rows = await db
    .select({
      id: serviceReports.id,
      title: serviceReports.title,
      status: serviceReports.status,
      workDate: serviceReports.workDate,
      reportNumber: serviceReports.reportNumber,
      customerName: serviceReports.customerName,
      signedAt: serviceReports.signedAt,
      submittedAt: serviceReports.submittedAt,
      createdAt: serviceReports.createdAt,
      project: {
        id: projects.id,
        title: projects.title,
        projectNumber: projects.projectNumber,
      },
    })
    .from(serviceReports)
    .leftJoin(projects, eq(serviceReports.projectId, projects.id))
    .where(and(...conditions))
    .orderBy(desc(serviceReports.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createReportSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { checklistItems, ...reportData } = parsed.data

  const count = await db
    .select()
    .from(serviceReports)
    .where(eq(serviceReports.companyId, session.user.companyId))
    .then(r => r.length + 1)

  const reportNumber = 'SB-' + String(count).padStart(5, '0')

  const [report] = await db
    .insert(serviceReports)
    .values({
      ...reportData,
      companyId: session.user.companyId,
      workerId: session.user.id,
      reportNumber,
      status: 'draft',
    })
    .returning()

  if (checklistItems.length > 0) {
    await db.insert(reportChecklistItems).values(
      checklistItems.map((item, i) => ({
        reportId: report.id,
        label: item.label,
        isChecked: item.isChecked,
        notes: item.notes ?? '',
        sortOrder: i,
      }))
    )
  }

  const officeUsers = await db.select({ id: users.id }).from(users)
    .where(and(
      eq(users.companyId, session.user.companyId),
      inArray(users.role, ['admin', 'office'])
    ))

  const senderName = `${session.user.firstName} ${session.user.lastName}`.trim()
  for (const u of officeUsers) {
    await sendPushToUser(
      u.id,
      session.user.companyId,
      'Neuer Servicebericht',
      `${senderName} hat einen Bericht eingereicht.`,
      { type: 'report_submitted', url: '/reports' }
    )
  }

  return NextResponse.json(report, { status: 201 })
}
