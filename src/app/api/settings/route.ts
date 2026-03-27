import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, session.user.companyId))

  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    name: company.name ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    addressStreet: company.addressStreet ?? '',
    addressCity: company.addressCity ?? '',
    addressZip: company.addressZip ?? '',
    addressCountry: company.addressCountry ?? 'DE',
    vatNumber: company.vatNumber ?? '',
    invoicePrefix: company.invoicePrefix ?? 'RE',
    offerPrefix: company.offerPrefix ?? 'AN',
    iban: (company.settings as any)?.iban ?? '',
    bic: (company.settings as any)?.bic ?? '',
    bankName: (company.settings as any)?.bankName ?? '',
    trade: (company.settings as any)?.trade ?? '',
    locale: (company.settings as any)?.locale ?? 'de',
    logoUrl: company.logoUrl ?? '',
    brandColor: company.brandColor ?? '#1a56db',
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'office'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { iban, bic, bankName, trade, locale, ...companyData } = body

  const [updated] = await db
    .update(companies)
    .set({
      name: companyData.name,
      email: companyData.email,
      phone: companyData.phone,
      addressStreet: companyData.addressStreet,
      addressCity: companyData.addressCity,
      addressZip: companyData.addressZip,
      addressCountry: companyData.addressCountry,
      vatNumber: companyData.vatNumber,
      invoicePrefix: companyData.invoicePrefix,
      offerPrefix: companyData.offerPrefix,
      logoUrl: companyData.logoUrl,
      brandColor: companyData.brandColor,
      settings: { iban, bic, bankName, trade, locale: locale ?? 'de' },
      updatedAt: new Date(),
    })
    .where(eq(companies.id, session.user.companyId))
    .returning()

  return NextResponse.json(updated)
}
