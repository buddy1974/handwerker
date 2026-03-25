import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { travelEntries } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const rows = await db.select().from(travelEntries)
    .where(and(eq(travelEntries.projectId, id), eq(travelEntries.companyId, session.user.companyId)))
    .orderBy(desc(travelEntries.createdAt))

  return NextResponse.json(rows)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { distanceKm, ratePerKm, notes, travelDate } = await req.json()

  if (!distanceKm) return NextResponse.json({ error: 'Distance required' }, { status: 400 })

  const rate = parseFloat(ratePerKm ?? '0.30')
  const distance = parseFloat(distanceKm)
  const total = Math.round(distance * rate * 100) / 100

  const [entry] = await db.insert(travelEntries).values({
    companyId: session.user.companyId,
    projectId: id,
    userId: session.user.id,
    distanceKm: String(distanceKm),
    ratePerKm: String(rate),
    totalCost: String(total),
    notes: notes ?? '',
    travelDate: travelDate ?? new Date().toISOString().split('T')[0],
  }).returning()

  return NextResponse.json(entry, { status: 201 })
}
