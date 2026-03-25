import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { materialEntries } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const rows = await db.select().from(materialEntries)
    .where(and(eq(materialEntries.projectId, id), eq(materialEntries.companyId, session.user.companyId)))
    .orderBy(desc(materialEntries.createdAt))

  return NextResponse.json(rows)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { name, quantity, unit, unitPrice, notes } = await req.json()

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const [entry] = await db.insert(materialEntries).values({
    companyId: session.user.companyId,
    projectId: id,
    userId: session.user.id,
    name,
    quantity: String(quantity ?? 1),
    unit: unit ?? 'Stk',
    unitPrice: String(unitPrice ?? 0),
    notes: notes ?? '',
  }).returning()

  return NextResponse.json(entry, { status: 201 })
}
