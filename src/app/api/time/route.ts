import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { timeEntries, projects } from '@/lib/db/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { createTimeEntrySchema } from '@/lib/validations/time'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const userId = searchParams.get('userId')
  const running = searchParams.get('running')

  const conditions = [eq(timeEntries.companyId, session.user.companyId)]

  if (session.user.role === 'worker') {
    conditions.push(eq(timeEntries.userId, session.user.id))
  } else if (userId) {
    conditions.push(eq(timeEntries.userId, userId))
  }

  if (projectId) conditions.push(eq(timeEntries.projectId, projectId))
  if (running === 'true') conditions.push(isNull(timeEntries.stoppedAt))

  const rows = await db
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      userId: timeEntries.userId,
      taskLabel: timeEntries.taskLabel,
      startedAt: timeEntries.startedAt,
      stoppedAt: timeEntries.stoppedAt,
      durationMin: timeEntries.durationMin,
      status: timeEntries.status,
      isBillable: timeEntries.isBillable,
      notes: timeEntries.notes,
      project: {
        id: projects.id,
        title: projects.title,
        projectNumber: projects.projectNumber,
      },
    })
    .from(timeEntries)
    .leftJoin(projects, eq(timeEntries.projectId, projects.id))
    .where(and(...conditions))
    .orderBy(desc(timeEntries.startedAt))
    .limit(100)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createTimeEntrySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await db
    .select()
    .from(timeEntries)
    .where(and(
      eq(timeEntries.userId, session.user.id),
      isNull(timeEntries.stoppedAt)
    ))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'Es läuft bereits eine Zeiterfassung. Bitte zuerst stoppen.' },
      { status: 409 }
    )
  }

  const [entry] = await db
    .insert(timeEntries)
    .values({
      ...parsed.data,
      startedAt: new Date(parsed.data.startedAt),
      stoppedAt: parsed.data.stoppedAt ? new Date(parsed.data.stoppedAt) : undefined,
      companyId: session.user.companyId,
      userId: session.user.id,
      status: 'running',
      hourlyRate: '0',
    })
    .returning()

  return NextResponse.json(entry, { status: 201 })
}
