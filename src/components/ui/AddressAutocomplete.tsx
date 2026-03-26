'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

type AddressResult = {
  display: string
  street: string
  city: string
  zip: string
  lat: number
  lng: number
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}: {
  value: string
  onChange: (val: string) => void
  onSelect?: (result: AddressResult) => void
  placeholder?: string
  className?: string
}) {
  const [results, setResults] = useState<AddressResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userLocationRef = useRef<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { userLocationRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude } },
        () => {}
      )
    }
  }, [])

  useEffect(() => {
    if (value.length < 3) { setResults([]); return }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/ai/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: value, lat: userLocationRef.current?.lat ?? null, lon: userLocationRef.current?.lon ?? null }),
        })
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setOpen(data.length > 0)
        }
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [value])

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          className={className ?? 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500'}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border border-gray-500 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => {
                onChange(r.street || r.display)
                onSelect?.(r)
                setOpen(false)
              }}
              className="w-full flex items-start gap-2 px-3 py-2 hover:bg-gray-800 text-left transition-colors"
            >
              <MapPin size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white text-xs truncate">{r.street || r.display}</p>
                <p className="text-gray-500 text-xs">{[r.zip, r.city].filter(Boolean).join(' ')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
