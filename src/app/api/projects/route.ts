import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, customers } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { createProjectSchema } from '@/lib/validations/project'
import { sendPushToUser } from '@/lib/push'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')

  const conditions = [eq(projects.companyId, session.user.companyId)]
  if (customerId) conditions.push(eq(projects.customerId, customerId))

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      priority: projects.priority,
      projectNumber: projects.projectNumber,
      locationCity: projects.locationCity,
      startDate: projects.startDate,
      endDate: projects.endDate,
      createdAt: projects.createdAt,
      customer: {
        id: customers.id,
        name: customers.name,
      },
    })
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(projects.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['admin', 'office', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const count = await db
    .select()
    .from(projects)
    .where(eq(projects.companyId, session.user.companyId))
    .then(r => r.length + 1)

  const projectNumber = 'PRJ-' + String(count).padStart(5, '0')

  let recurringNextDate = parsed.data.recurringNextDate ?? null
  if (parsed.data.recurringInterval && parsed.data.startDate && !recurringNextDate) {
    const base = new Date(parsed.data.startDate)
    if (parsed.data.recurringInterval === 'monthly') base.setMonth(base.getMonth() + 1)
    else if (parsed.data.recurringInterval === 'quarterly') base.setMonth(base.getMonth() + 3)
    else base.setFullYear(base.getFullYear() + 1)
    recurringNextDate = base.toISOString().split('T')[0]
  }

  const [project] = await db
    .insert(projects)
    .values({
      ...parsed.data,
      companyId: session.user.companyId,
      projectNumber,
      createdBy: session.user.id,
      recurringNextDate,
    })
    .returning()

  const assignedUserIds: string[] = Array.isArray(body.assignedUserIds) ? body.assignedUserIds : []
  for (const uid of assignedUserIds) {
    await sendPushToUser(
      uid,
      session.user.companyId,
      'Neues Projekt zugewiesen',
      `Du wurdest dem Projekt "${project.title}" zugewiesen.`,
      { type: 'project_assigned', url: `/projects/${project.id}` }
    )
  }

  return NextResponse.json(project, { status: 201 })
}
