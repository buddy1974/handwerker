import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: { imageBase64?: string; mediaType?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON or body too large' }, { status: 400 })
    }

    const { imageBase64, mediaType } = body
    if (!imageBase64) return NextResponse.json({ error: 'Image required' }, { status: 400 })

    const sizeInMB = (imageBase64.length * 0.75) / 1024 / 1024
    if (sizeInMB > 4) {
      return NextResponse.json({ error: `Image too large: ${sizeInMB.toFixed(1)}MB. Max 4MB. Please compress the image first.` }, { status: 413 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: (mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif') ?? 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Du bist ein OCR-Assistent für ein deutsches Handwerk-Softwaresystem.
Lies dieses Bild (handgeschriebene Notiz, gedruckter Zettel, oder Foto eines Auftrags).
Extrahiere alle relevanten Informationen und gib sie als JSON zurück.

Gib NUR gültiges JSON zurück, kein Markdown, keine Erklärungen, keine Backticks.

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
  "materials": [],
  "notes": "string oder null",
  "confidence": "high"
}`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const parsed = JSON.parse(cleaned)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ error: 'Parse failed', raw: cleaned }, { status: 422 })
    }
  } catch (err: unknown) {
    console.error('OCR error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
