import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, locale } = await req.json()
  if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })

  const prompt = locale === 'en'
    ? `Extract invoice data from this text and return ONLY valid JSON:
"${text}"
{
  "title": "invoice title",
  "items": [{ "title": "item description", "quantity": 1, "unit": "unit", "unitPrice": 0.00, "itemType": "unit or flat" }],
  "depositAmount": 0,
  "notes": "any notes or null"
}`
    : `Extrahiere Rechnungsdaten aus diesem Text und gib NUR gültiges JSON zurück:
"${text}"
{
  "title": "Rechnungstitel",
  "items": [{ "title": "Positionsbezeichnung", "quantity": 1, "unit": "Einheit", "unitPrice": 0.00, "itemType": "unit oder flat" }],
  "depositAmount": 0,
  "notes": "Notizen falls vorhanden oder null"
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return NextResponse.json(JSON.parse(cleaned))
  } catch {
    return NextResponse.json({ error: 'Parse failed' }, { status: 422 })
  }
}
