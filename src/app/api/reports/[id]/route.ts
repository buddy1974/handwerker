import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { serviceReports, reportChecklistItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { updateReportSchema } from '@/lib/validations/report'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [report] = await db
    .select()
    .from(serviceReports)
    .where(and(
      eq(serviceReports.id, id),
      eq(serviceReports.companyId, session.user.companyId)
    ))

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const checklist = await db
    .select()
    .from(reportChecklistItems)
    .where(eq(reportChecklistItems.reportId, id))
    .orderBy(reportChecklistItems.sortOrder)

  return NextResponse.json({ ...report, checklistItems: checklist })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const parsed = updateReportSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { checklistItems, ...reportData } = parsed.data

  const [updated] = await db
    .update(serviceReports)
    .set({ ...reportData, updatedAt: new Date() })
    .where(and(
      eq(serviceReports.id, id),
      eq(serviceReports.companyId, session.user.companyId)
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(updated)
}
