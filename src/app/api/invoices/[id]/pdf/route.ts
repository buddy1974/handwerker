import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invoices, invoiceItems, customers, companies } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/InvoicePDF'
import type { PDFCompany, PDFCustomer, PDFItem } from '@/lib/pdf/OfferPDF'
import type { PDFInvoice } from '@/lib/pdf/InvoicePDF'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.companyId, session.user.companyId)))

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [customer] = await db.select().from(customers).where(eq(customers.id, invoice.customerId))
  const [company] = await db.select().from(companies).where(eq(companies.id, session.user.companyId))
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(invoiceItems.sortOrder)

  const pdfCompany: PDFCompany = {
    name: company.name,
    addressStreet: company.addressStreet ?? undefined,
    addressCity: company.addressCity ?? undefined,
    addressZip: company.addressZip ?? undefined,
    vatNumber: company.vatNumber ?? undefined,
    email: company.email ?? undefined,
    phone: company.phone ?? undefined,
    logoUrl: company.logoUrl ?? undefined,
    brandColor: company.brandColor ?? undefined,
    iban: (company.settings as Record<string, string>)?.iban,
    bic: (company.settings as Record<string, string>)?.bic,
    bankName: (company.settings as Record<string, string>)?.bankName,
  }

  const pdfCustomer: PDFCustomer = {
    name: customer?.name ?? '',
    addressStreet: customer?.addressStreet ?? undefined,
    addressCity: customer?.addressCity ?? undefined,
    addressZip: customer?.addressZip ?? undefined,
    email: customer?.email ?? undefined,
  }

  const pdfInvoice: PDFInvoice = {
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
    iban: invoice.iban,
    bic: invoice.bic,
    bankName: invoice.bankName,
  }

  const pdfItems: PDFItem[] = items.map((item, i) => ({
    position: i + 1,
    title: item.title,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate,
    lineTotal: item.lineTotal,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF, { company: pdfCompany, customer: pdfCustomer, invoice: pdfInvoice, items: pdfItems }) as any
  )

  const filename = `Rechnung-${invoice.invoiceNumber ?? id}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
