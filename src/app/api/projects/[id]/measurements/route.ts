import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { measurements } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { createMeasurementSchema } from '@/lib/validations/measurement'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const rows = await db
    .select()
    .from(measurements)
    .where(and(
      eq(measurements.projectId, id),
      eq(measurements.companyId, session.user.companyId)
    ))
    .orderBy(desc(measurements.createdAt))
  return NextResponse.json(rows)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const parsed = createMeasurementSchema.safeParse({ ...body, projectId: id })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const [measurement] = await db
    .insert(measurements)
    .values({
      ...parsed.data,
      companyId: session.user.companyId,
      createdBy: session.user.id,
    })
    .returning()
  return NextResponse.json(measurement, { status: 201 })
}
