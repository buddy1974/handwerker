import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64, mediaType } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'Image required' }, { status: 400 })

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType ?? 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Du bist ein OCR-Assistent für ein deutsches Handwerk-Softwaresystem.
Lies dieses Bild (handgeschriebene Notiz, gedruckter Zettel, oder Foto eines Auftrags).
Extrahiere alle relevanten Informationen und gib sie als JSON zurück.

Gib NUR gültiges JSON zurück, kein Markdown, keine Erklärungen.

Format:
{
  "customerName": "string oder null",
  "customerPhone": "string oder null",
  "customerEmail": "string oder null",
  "addressStreet": "string oder null",
  "addressCity": "string oder null",
  "addressZip": "string oder null",
  "projectTitle": "string oder null",
  "projectDescription": "string oder null",
  "startDate": "YYYY-MM-DD oder null",
  "endDate": "YYYY-MM-DD oder null",
  "materials": ["string array von erwähnten Materialien"],
  "notes": "string oder null",
  "confidence": "high|medium|low"
}`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Could not parse response', raw: text }, { status: 422 })
  }
}
