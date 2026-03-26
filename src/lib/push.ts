import webpush from 'web-push'
import { db } from '@/lib/db'
import { pushSubscriptions, notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushToUser(
  userId: string,
  companyId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  await db.insert(notifications).values({
    userId,
    companyId,
    type: data?.type ?? 'info',
    title,
    body,
    data: data ?? {},
  })

  const subs = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))

  const payload = JSON.stringify({ title, body, data })

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        }
      }
    })
  )
}
