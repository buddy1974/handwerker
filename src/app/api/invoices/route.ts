import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems, customers } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { createInvoiceSchema } from '@/lib/validations/invoice'
import { calcTotals } from '@/lib/utils/money'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      status: invoices.status,
      total: invoices.total,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
      customer: { id: customers.id, name: customers.name },
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.companyId, session.user.companyId))
    .orderBy(desc(invoices.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'office', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createInvoiceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { items, ...invoiceData } = parsed.data
  const totals = calcTotals(items)

  const nr = await db.select().from(invoices).where(eq(invoices.companyId, session.user.companyId)).then(r => r.length + 1)
  const invoiceNumber = 'RE-' + String(nr).padStart(4, '0')

  const [invoice] = await db.insert(invoices).values({
    ...invoiceData,
    companyId: session.user.companyId,
    invoiceNumber,
    subtotal: String(totals.subtotal),
    taxAmount: String(totals.taxAmount),
    total: String(totals.total),
    createdBy: session.user.id,
  }).returning()

  if (items.length > 0) {
    await db.insert(invoiceItems).values(
      items.map((item, i) => ({
        invoiceId: invoice.id,
        position: i + 1,
        title: item.title,
        description: item.description ?? '',
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountPct: item.discountPct,
        taxRate: item.taxRate,
        lineTotal: String(calcLineTotal(item.quantity, item.unitPrice, item.discountPct)),
        sortOrder: i,
      }))
    )
  }

  return NextResponse.json(invoice, { status: 201 })
}

function calcLineTotal(q: string, p: string, d: string) {
  return Math.round(parseFloat(q) * parseFloat(p) * (1 - parseFloat(d) / 100) * 100) / 100
}
