import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { offers, offerItems, customers, companies } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { renderToBuffer } from '@react-pdf/renderer'
import { OfferPDF } from '@/lib/pdf/OfferPDF'
import { sendOfferEmail } from '@/lib/email/send'
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

  const [offer] = await db.select().from(offers).where(and(
    eq(offers.id, id),
    eq(offers.companyId, session.user.companyId)
  ))
  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [company] = await db.select().from(companies).where(eq(companies.id, session.user.companyId))
  const [customer] = await db.select().from(customers).where(eq(customers.id, offer.customerId))
  const items = await db.select().from(offerItems).where(eq(offerItems.offerId, id)).orderBy(offerItems.sortOrder)

  const companySettings = company.settings as Record<string, string> | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(OfferPDF, {
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
      offer: {
        offerNumber: offer.offerNumber,
        title: offer.title,
        issueDate: offer.issueDate,
        validUntil: offer.validUntil,
        introText: offer.introText,
        outroText: offer.outroText,
        subtotal: offer.subtotal,
        taxAmount: offer.taxAmount,
        total: offer.total,
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

  await sendOfferEmail({
    to: email,
    companyName: company.name,
    offerNumber: offer.offerNumber ?? '',
    total: formatEur(Number(offer.total)),
    pdfBuffer: Buffer.from(pdfBuffer),
    fileName: `${offer.offerNumber ?? 'Angebot'}.pdf`,
  })

  await db.update(offers)
    .set({ status: 'sent', sentAt: new Date(), updatedAt: new Date() })
    .where(eq(offers.id, id))

  return NextResponse.json({ success: true })
}
