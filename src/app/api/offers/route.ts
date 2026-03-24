import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { offers, offerItems, customers } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { createOfferSchema } from '@/lib/validations/offer'
import { calcTotals } from '@/lib/utils/money'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select({
      id: offers.id,
      offerNumber: offers.offerNumber,
      title: offers.title,
      status: offers.status,
      total: offers.total,
      issueDate: offers.issueDate,
      validUntil: offers.validUntil,
      createdAt: offers.createdAt,
      customer: { id: customers.id, name: customers.name },
    })
    .from(offers)
    .leftJoin(customers, eq(offers.customerId, customers.id))
    .where(eq(offers.companyId, session.user.companyId))
    .orderBy(desc(offers.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'office', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createOfferSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { items, ...offerData } = parsed.data
  const totals = calcTotals(items)

  const nr = await db.select().from(offers).where(eq(offers.companyId, session.user.companyId)).then(r => r.length + 1)
  const offerNumber = 'AN-' + String(nr).padStart(4, '0')

  const [offer] = await db.insert(offers).values({
    ...offerData,
    companyId: session.user.companyId,
    offerNumber,
    subtotal: String(totals.subtotal),
    taxAmount: String(totals.taxAmount),
    total: String(totals.total),
    createdBy: session.user.id,
  }).returning()

  if (items.length > 0) {
    await db.insert(offerItems).values(
      items.map((item, i) => ({
        offerId: offer.id,
        position: i + 1,
        title: item.title,
        description: item.description ?? '',
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountPct: item.discountPct,
        taxRate: item.taxRate,
        lineTotal: String(calcLineTotal(item.quantity, item.unitPrice, item.discountPct)),
        isOptional: item.isOptional,
        sortOrder: i,
      }))
    )
  }

  return NextResponse.json(offer, { status: 201 })
}

function calcLineTotal(q: string, p: string, d: string) {
  return Math.round(parseFloat(q) * parseFloat(p) * (1 - parseFloat(d) / 100) * 100) / 100
}
