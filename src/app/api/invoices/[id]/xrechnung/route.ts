import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems, customers, companies } from '@/lib/db/schema'
import { and, eq, asc } from 'drizzle-orm'
import { generateXRechnung } from '@/lib/xrechnung'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [invoice] = await db.select().from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.companyId, session.user.companyId)))

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [customer] = await db.select().from(customers).where(eq(customers.id, invoice.customerId))
  const [company] = await db.select().from(companies).where(eq(companies.id, session.user.companyId))
  const items = await db.select().from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id))
    .orderBy(asc(invoiceItems.sortOrder))

  const settings = (company.settings as Record<string, string>) ?? {}

  const xml = generateXRechnung({
    invoiceNumber: invoice.invoiceNumber ?? id,
    issueDate: invoice.issueDate ?? new Date().toISOString().split('T')[0],
    dueDate: invoice.dueDate ?? new Date().toISOString().split('T')[0],
    deliveryDate: invoice.deliveryDate ?? undefined,
    paymentTerms: invoice.paymentTerms ?? undefined,
    notes: invoice.notes ?? undefined,
    seller: {
      name: company.name,
      street: company.addressStreet ?? '',
      city: company.addressCity ?? '',
      zip: company.addressZip ?? '',
      vatId: company.vatNumber ?? settings.vatId ?? '',
      iban: invoice.iban ?? settings.iban ?? '',
      bic: invoice.bic ?? settings.bic ?? '',
      bankName: invoice.bankName ?? settings.bankName ?? '',
      email: company.email ?? '',
    },
    buyer: {
      name: customer?.name ?? '',
      street: customer?.addressStreet ?? '',
      city: customer?.addressCity ?? '',
      zip: customer?.addressZip ?? '',
      email: customer?.email ?? '',
    },
    items: items.map(item => ({
      title: item.title,
      description: item.description ?? undefined,
      quantity: Number(item.quantity),
      unit: item.unit ?? 'C62',
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate ?? 19),
      lineTotal: Number(item.lineTotal ?? 0),
    })),
    subtotal: Number(invoice.subtotal ?? 0),
    taxAmount: Number(invoice.taxAmount ?? 0),
    total: Number(invoice.total ?? 0),
  })

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber ?? id}-xrechnung.xml"`,
    },
  })
}
