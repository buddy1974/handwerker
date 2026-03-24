import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { timeEntries } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { stopTimeEntrySchema, updateTimeEntrySchema } from '@/lib/validations/time'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const isStop = 'stoppedAt' in body && Object.keys(body).length === 1
  const schema = isStop ? stopTimeEntrySchema : updateTimeEntrySchema
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const conditions = [eq(timeEntries.id, id)]
  if (session.user.role === 'worker') {
    conditions.push(eq(timeEntries.userId, session.user.id))
  } else {
    conditions.push(eq(timeEntries.companyId, session.user.companyId))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { ...parsed.data, updatedAt: new Date() }

  // Convert datetime strings to Date objects for Drizzle
  if (updateData.startedAt) updateData.startedAt = new Date(updateData.startedAt as string)
  if (updateData.stoppedAt) updateData.stoppedAt = new Date(updateData.stoppedAt as string)

  if (isStop) {
    updateData.status = 'stopped'
    const entry = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id))
      .limit(1)
      .then(r => r[0])

    if (entry) {
      const start = new Date(entry.startedAt).getTime()
      const stop = (updateData.stoppedAt as Date).getTime()
      updateData.durationMin = Math.round((stop - start) / 60000)
    }
  }

  const [updated] = await db
    .update(timeEntries)
    .set(updateData)
    .where(and(...conditions))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const conditions = [eq(timeEntries.id, id)]
  if (session.user.role === 'worker') {
    conditions.push(eq(timeEntries.userId, session.user.id))
  } else {
    conditions.push(eq(timeEntries.companyId, session.user.companyId))
  }

  await db.delete(timeEntries).where(and(...conditions))

  return NextResponse.json({ success: true })
}
