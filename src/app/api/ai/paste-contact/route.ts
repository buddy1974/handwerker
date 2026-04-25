import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Extract contact information from this text and return ONLY valid JSON:
"${text}"

{
  "name": "full name or null",
  "company": "company name or null",
  "email": "email or null",
  "phone": "phone number or null",
  "addressStreet": "street or null",
  "addressCity": "city or null",
  "addressZip": "zip or null",
  "addressCountry": "DE or US or null"
}`,
    }],
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return NextResponse.json(JSON.parse(cleaned))
  } catch {
    return NextResponse.json({ error: 'Parse failed' }, { status: 422 })
  }
}
