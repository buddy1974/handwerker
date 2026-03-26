import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { updateProjectSchema } from '@/lib/validations/project'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [project] = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.id, id),
      eq(projects.companyId, session.user.companyId)
    ))

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(project)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['admin', 'office', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [existing] = await db.select().from(projects)
    .where(and(eq(projects.id, id), eq(projects.companyId, session.user.companyId)))

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const warrantyPatch: { warrantyStartDate?: string; warrantyEndDate?: string } = {}
  if (parsed.data.status === 'completed' && !existing.warrantyStartDate && !parsed.data.warrantyStartDate) {
    const today = new Date().toISOString().split('T')[0]
    warrantyPatch.warrantyStartDate = today
    const end = new Date()
    end.setFullYear(end.getFullYear() + 5)
    warrantyPatch.warrantyEndDate = end.toISOString().split('T')[0]
  }

  const [updated] = await db
    .update(projects)
    .set({ ...parsed.data, ...warrantyPatch, updatedAt: new Date() })
    .where(and(
      eq(projects.id, id),
      eq(projects.companyId, session.user.companyId)
    ))
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

  if (!['admin', 'office'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const [deleted] = await db
    .update(projects)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(
      eq(projects.id, id),
      eq(projects.companyId, session.user.companyId)
    ))
    .returning()

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
