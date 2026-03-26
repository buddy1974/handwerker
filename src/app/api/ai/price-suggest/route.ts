import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, unit, quantity } = await req.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const [company] = await db.select().from(companies)
    .where(eq(companies.id, session.user.companyId))

  const settings = (company.settings as Record<string, string>) ?? {}
  const trade = settings.trade ?? 'Handwerk'
  const city = company.addressCity ?? 'Deutschland'

  const prompt = `Du bist ein Experte für Handwerkerpreise in Deutschland.
Branche: ${trade}
Standort: ${city}
Leistung: ${title}${description ? ` — ${description}` : ''}
Einheit: ${unit || 'Stk'}
Menge: ${quantity || 1}

Gib einen realistischen Marktpreis pro Einheit (netto, ohne MwSt) für diese Leistung an.
Berücksichtige aktuelle deutsche Marktpreise 2025/2026.

Antworte NUR mit einem JSON-Objekt, kein Markdown:
{
  "unitPrice": 85.00,
  "reasoning": "Kurze Begründung auf Deutsch (1 Satz)",
  "priceRange": { "min": 70.00, "max": 100.00 }
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw: cleaned }, { status: 422 })
  }
}
