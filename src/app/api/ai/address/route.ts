import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const query = req.nextUrl.searchParams.get('q')
  const lat = req.nextUrl.searchParams.get('lat')
  const lon = req.nextUrl.searchParams.get('lon')
  if (!query || query.length < 3) return NextResponse.json([])

  const encoded = encodeURIComponent(query + ', Germany')
  const locationBias = lat && lon ? `&lat=${lat}&lon=${lon}` : ''
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=5&countrycodes=de${locationBias}`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'HandwerkOS/1.0 (noreply@maxpromo.digital)' },
  })

  if (!res.ok) return NextResponse.json([])

  const data = await res.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = data.map((item: any) => ({
    display: item.display_name,
    street: [item.address.road, item.address.house_number].filter(Boolean).join(' '),
    city: item.address.city || item.address.town || item.address.village || '',
    zip: item.address.postcode || '',
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }))

  return NextResponse.json(results)
}
