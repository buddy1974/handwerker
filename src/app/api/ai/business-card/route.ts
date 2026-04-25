import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64 } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'Image required' }, { status: 400 })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
        },
        {
          type: 'text',
          text: `Extract all contact information from this business card.
Return ONLY valid JSON, no markdown:
{
  "name": "full name or null",
  "company": "company name or null",
  "email": "email or null",
  "phone": "phone number or null",
  "addressStreet": "street or null",
  "addressCity": "city or null",
  "addressZip": "zip/postcode or null",
  "addressCountry": "country code (DE or US) or null",
  "website": "website or null"
}`,
        },
      ],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return NextResponse.json(JSON.parse(cleaned))
  } catch {
    return NextResponse.json({ error: 'Parse failed' }, { status: 422 })
  }
}
