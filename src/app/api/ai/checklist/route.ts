import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'
import { getChecklistForTrade } from '@/lib/trade-checklists'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectTitle, projectDescription } = await req.json()

  const [company] = await db.select().from(companies)
    .where(eq(companies.id, session.user.companyId))

  const settings = (company.settings as Record<string, string>) ?? {}
  const trade = settings.trade ?? null
  const baseChecklist = getChecklistForTrade(trade)

  if (!projectTitle) {
    return NextResponse.json({ items: baseChecklist })
  }

  const prompt = `Du bist ein Qualitätsprüfer für ein deutsches Handwerksunternehmen (${trade ?? 'Handwerk'}).

Aufgabe: Erstelle eine Checkliste für folgenden Auftrag:
Titel: ${projectTitle}
${projectDescription ? `Beschreibung: ${projectDescription}` : ''}

Basis-Checkliste für ${trade ?? 'allgemeines Handwerk'}:
${baseChecklist.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Passe die Checkliste an diesen spezifischen Auftrag an. Behalte relevante Punkte, entferne unpassende, füge auftragsspezifische hinzu.
Maximal 10 Punkte. Kurz und präzise auf Deutsch.

Antworte NUR mit einem JSON-Array von Strings, kein Markdown:
["Punkt 1", "Punkt 2", ...]`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const items = JSON.parse(cleaned)
    return NextResponse.json({ items: Array.isArray(items) ? items : baseChecklist })
  } catch {
    return NextResponse.json({ items: baseChecklist })
  }
}
