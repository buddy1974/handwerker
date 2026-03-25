import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projectMessages, users } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const rows = await db
    .select({
      id: projectMessages.id,
      message: projectMessages.message,
      createdAt: projectMessages.createdAt,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      },
    })
    .from(projectMessages)
    .leftJoin(users, eq(projectMessages.userId, users.id))
    .where(and(
      eq(projectMessages.projectId, id),
      eq(projectMessages.companyId, session.user.companyId)
    ))
    .orderBy(asc(projectMessages.createdAt))

  return NextResponse.json(rows)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { message } = await req.json()

  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const [msg] = await db.insert(projectMessages).values({
    companyId: session.user.companyId,
    projectId: id,
    userId: session.user.id,
    message: message.trim(),
  }).returning()

  return NextResponse.json(msg, { status: 201 })
}
