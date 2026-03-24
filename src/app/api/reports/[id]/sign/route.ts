import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { serviceReports } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { signatureDataUrl, customerName } = await req.json()

  const [updated] = await db
    .update(serviceReports)
    .set({
      signaturePath: signatureDataUrl,
      customerName: customerName ?? '',
      signedAt: new Date(),
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(serviceReports.id, id),
      eq(serviceReports.companyId, session.user.companyId)
    ))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(updated)
}
