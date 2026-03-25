import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { input, field } = await req.json()
  if (!input) return NextResponse.json({ error: 'Input required' }, { status: 400 })

  const fieldPrompts: Record<string, string> = {
    workDone: 'Beschreibung der durchgeführten Arbeiten',
    description: 'Projektbeschreibung',
    nextSteps: 'Nächste Schritte / Empfehlungen',
    materialsUsed: 'Verwendete Materialien und Mengen',
  }

  const fieldLabel = fieldPrompts[field] ?? 'Text'

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Du bist ein professioneller Assistent für deutsche Handwerksberichte.

Der Benutzer hat folgende Stichworte eingegeben für das Feld "${fieldLabel}":
"${input}"

Schreibe einen professionellen, vollständigen deutschen Satz oder Absatz für dieses Feld.
Verwende korrekte Fachterminologie für das Handwerk.
Antworte NUR mit dem fertig formulierten Text, keine Erklärungen, keine Anführungszeichen.`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : input

  return NextResponse.json({ text })
}
