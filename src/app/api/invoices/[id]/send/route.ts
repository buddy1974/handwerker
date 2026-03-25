import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems, customers, companies } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/InvoicePDF'
import { sendInvoiceEmail } from '@/lib/email/send'
import { formatEur } from '@/lib/utils/money'
import React from 'react'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'office', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { email } = await req.json()

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const [invoice] = await db.select().from(invoices).where(and(
    eq(invoices.id, id),
    eq(invoices.companyId, session.user.companyId)
  ))
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [company] = await db.select().from(companies).where(eq(companies.id, session.user.companyId))
  const [customer] = await db.select().from(customers).where(eq(customers.id, invoice.customerId))
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(invoiceItems.sortOrder)

  const companySettings = company.settings as Record<string, string> | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(InvoicePDF, {
      company: {
        name: company.name,
        addressStreet: company.addressStreet ?? '',
        addressCity: company.addressCity ?? '',
        addressZip: company.addressZip ?? '',
        vatNumber: company.vatNumber ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        logoUrl: company.logoUrl ?? '',
        brandColor: company.brandColor ?? '#1a56db',
        iban: companySettings?.iban ?? '',
        bic: companySettings?.bic ?? '',
        bankName: companySettings?.bankName ?? '',
      },
      customer: {
        name: customer?.name ?? '',
        addressStreet: customer?.addressStreet ?? '',
        addressCity: customer?.addressCity ?? '',
        addressZip: customer?.addressZip ?? '',
        email: customer?.email ?? '',
      },
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        title: invoice.title,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        deliveryDate: invoice.deliveryDate,
        paymentTerms: invoice.paymentTerms,
        introText: invoice.introText,
        outroText: invoice.outroText,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        iban: companySettings?.iban ?? '',
        bic: companySettings?.bic ?? '',
        bankName: companySettings?.bankName ?? '',
      },
      items: items.map(item => ({
        position: item.position,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        lineTotal: item.lineTotal,
      })),
    }) as any
  )

  await sendInvoiceEmail({
    to: email,
    companyName: company.name,
    invoiceNumber: invoice.invoiceNumber ?? '',
    total: formatEur(Number(invoice.total)),
    dueDate: invoice.dueDate,
    pdfBuffer: Buffer.from(pdfBuffer),
    fileName: `${invoice.invoiceNumber ?? 'Rechnung'}.pdf`,
  })

  await db.update(invoices)
    .set({ status: 'sent', sentAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, id))

  return NextResponse.json({ success: true })
}
