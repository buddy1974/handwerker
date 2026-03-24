import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [invoice] = await db.select().from(invoices).where(and(
    eq(invoices.id, id),
    eq(invoices.companyId, session.user.companyId)
  ))
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(invoiceItems.sortOrder)
  return NextResponse.json({ ...invoice, items })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const [updated] = await db.update(invoices)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.companyId, session.user.companyId)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
