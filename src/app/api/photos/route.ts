import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const rows = await db
    .select()
    .from(photos)
    .where(and(
      eq(photos.projectId, projectId),
      eq(photos.companyId, session.user.companyId)
    ))
    .orderBy(desc(photos.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    projectId, reportId, storagePath, fileName,
    fileSize, mimeType, width, height, caption,
    takenAt, locationLat, locationLng,
  } = body

  if (!projectId || !storagePath || !fileName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [photo] = await db
    .insert(photos)
    .values({
      companyId: session.user.companyId,
      projectId,
      reportId: reportId ?? null,
      uploadedBy: session.user.id,
      storagePath,
      fileName,
      fileSize: fileSize ?? null,
      mimeType: mimeType ?? 'image/jpeg',
      width: width ?? null,
      height: height ?? null,
      caption: caption ?? null,
      takenAt: takenAt ? new Date(takenAt) : null,
      locationLat: locationLat ? String(locationLat) : null,
      locationLng: locationLng ? String(locationLng) : null,
      sortOrder: 0,
    })
    .returning()

  return NextResponse.json(photo, { status: 201 })
}
