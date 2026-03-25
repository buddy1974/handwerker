import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { offers, offerItems, customers, companies } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { OfferPDF } from '@/lib/pdf/OfferPDF'
import type { PDFCompany, PDFCustomer, PDFItem, PDFOffer } from '@/lib/pdf/OfferPDF'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [offer] = await db
    .select()
    .from(offers)
    .where(and(eq(offers.id, id), eq(offers.companyId, session.user.companyId)))

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [customer] = await db.select().from(customers).where(eq(customers.id, offer.customerId))
  const [company] = await db.select().from(companies).where(eq(companies.id, session.user.companyId))
  const items = await db.select().from(offerItems).where(eq(offerItems.offerId, id)).orderBy(offerItems.sortOrder)

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

  const pdfOffer: PDFOffer = {
    offerNumber: offer.offerNumber,
    title: offer.title,
    issueDate: offer.issueDate,
    validUntil: offer.validUntil,
    introText: offer.introText,
    outroText: offer.outroText,
    subtotal: offer.subtotal,
    taxAmount: offer.taxAmount,
    total: offer.total,
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
    React.createElement(OfferPDF, { company: pdfCompany, customer: pdfCustomer, offer: pdfOffer, items: pdfItems }) as any
  )

  const filename = `Angebot-${offer.offerNumber ?? id}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
