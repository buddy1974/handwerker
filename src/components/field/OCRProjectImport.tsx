'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Sparkles, X } from 'lucide-react'

type ExtractedData = {
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  addressStreet: string | null
  addressCity: string | null
  addressZip: string | null
  projectTitle: string | null
  projectDescription: string | null
  startDate: string | null
  endDate: string | null
  materials: string[]
  notes: string | null
  confidence: string
}

export default function OCRProjectImport({
  onImport,
  onCustomerAutoCreated,
}: {
  onImport: (data: ExtractedData) => void
  onCustomerAutoCreated: (id: string, name: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractedData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        const MAX = 1200
        let w = img.width
        let h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
          else { w = Math.round((w * MAX) / h); h = MAX }
        }
        canvas.width = w
        canvas.height = h
        ctx?.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.onerror = reject
      img.src = url
    })
  }

  const processImage = async (file: File) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const dataUrl = await compressImage(file)
      setPreview(dataUrl)

      const base64 = dataUrl.split(',')[1]

      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg' }),
      })

      if (res.ok) {
        const data = await res.json()
        setResult(data)

        // Auto-create customer silently in background
        if (data.customerName) {
          fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: data.customerName }),
          })
            .then(r => r.ok ? r.json() : null)
            .then(customer => {
              if (customer?.id) onCustomerAutoCreated(customer.id, customer.name)
            })
            .catch(() => {}) // silent fail
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error ?? `Fehler ${res.status}`)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Verarbeiten')
    } finally {
      setLoading(false)
    }
  }

  const confidenceColor = {
    high: 'text-green-400',
    medium: 'text-yellow-400',
    low: 'text-red-400',
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <Sparkles size={14} className="text-purple-400" />
        <h3 className="text-sm font-medium text-white">Aus Foto importieren (KI)</h3>
      </div>

      <div className="p-4">
        {!preview ? (
          <div className="space-y-2">
            <p className="text-gray-500 text-xs">Foto einer Notiz, eines Zettels oder Auftrags aufnehmen — KI liest alles aus.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.accept = 'image/*'
                    fileRef.current.capture = 'environment'
                    fileRef.current.click()
                  }
                }}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-3 py-2 rounded-lg"
              >
                <Camera size={14} />
                Foto aufnehmen
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg"
              >
                <Upload size={14} />
                Bild auswählen
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-700" />
              <div className="flex-1">
                {loading && (
                  <div className="flex items-center gap-2 text-purple-400 text-sm">
                    <Sparkles size={14} className="animate-pulse" />
                    KI liest Bild...
                  </div>
                )}
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {result && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Konfidenz:</span>
                      <span className={`text-xs font-medium ${confidenceColor[result.confidence as keyof typeof confidenceColor] ?? 'text-gray-400'}`}>
                        {result.confidence === 'high' ? 'Hoch' : result.confidence === 'medium' ? 'Mittel' : 'Niedrig'}
                      </span>
                    </div>
                    {result.customerName && <p className="text-green-400 text-xs">✓ Kunde: {result.customerName}</p>}
                    {result.projectTitle && <p className="text-green-400 text-xs">✓ Projekt: {result.projectTitle}</p>}
                    {result.addressStreet && <p className="text-green-400 text-xs">✓ Adresse erkannt</p>}
                    {result.materials.length > 0 && <p className="text-green-400 text-xs">✓ {result.materials.length} Materialien</p>}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setPreview(null); setResult(null) }}
                className="text-gray-600 hover:text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            {result && (
              <button
                type="button"
                onClick={() => onImport(result)}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg"
              >
                Daten in Formular übernehmen
              </button>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) processImage(file)
          }}
        />
      </div>
    </div>
  )
}
