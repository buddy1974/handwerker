import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const existing = await db.select().from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.userId, session.user.id),
      eq(pushSubscriptions.endpoint, endpoint)
    ))

  if (existing.length === 0) {
    await db.insert(pushSubscriptions).values({
      userId: session.user.id,
      companyId: session.user.companyId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  await db.delete(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.userId, session.user.id),
      eq(pushSubscriptions.endpoint, endpoint)
    ))

  return NextResponse.json({ ok: true })
}
