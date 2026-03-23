import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { customers } from '@/lib/db/schema'
import { eq, desc, ilike, and } from 'drizzle-orm'
import { createCustomerSchema } from '@/lib/validations/customer'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const conditions = [
    eq(customers.companyId, session.user.companyId),
    eq(customers.isActive, true),
  ]

  if (search) {
    conditions.push(ilike(customers.name, `%${search}%`))
  }

  const rows = await db
    .select()
    .from(customers)
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['admin', 'office', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createCustomerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [customer] = await db
    .insert(customers)
    .values({
      ...parsed.data,
      companyId: session.user.companyId,
      createdBy: session.user.id,
    })
    .returning()

  return NextResponse.json(customer, { status: 201 })
}
