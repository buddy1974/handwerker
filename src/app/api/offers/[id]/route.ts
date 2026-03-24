import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { offers, offerItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [offer] = await db.select().from(offers).where(and(
    eq(offers.id, id),
    eq(offers.companyId, session.user.companyId)
  ))
  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = await db.select().from(offerItems).where(eq(offerItems.offerId, id)).orderBy(offerItems.sortOrder)
  return NextResponse.json({ ...offer, items })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const [updated] = await db.update(offers)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(offers.id, id), eq(offers.companyId, session.user.companyId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
