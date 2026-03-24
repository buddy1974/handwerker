'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Upload, Ruler } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { Annotation } from '@/lib/validations/measurement'

const AufmassCanvas = dynamic(() => import('@/components/field/AufmassCanvas'), { ssr: false })

export default function AufmassPage() {
  const params = useParams()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
  }

  const handleSave = async (annotations: Annotation[], dataUrl: string) => {
    setSaving(true)
    await fetch(`/api/projects/${params.id}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: params.id,
        title: 'Aufmaß ' + new Date().toLocaleDateString('de-DE'),
        annotations,
        annotatedPhotoPath: dataUrl,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      router.push(`/projects/${params.id}`)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <Link href={`/projects/${params.id}`} className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <Ruler size={16} className="text-blue-400" />
          <h1 className="text-white font-medium text-sm">Aufmaß</h1>
        </div>
      </div>

      {saved ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-green-400 text-lg font-medium">✓ Gespeichert</p>
            <p className="text-gray-500 text-sm mt-1">Weiterleitung...</p>
          </div>
        </div>
      ) : imageUrl ? (
        <div className="flex-1 relative">
          <AufmassCanvas
            imageUrl={imageUrl}
            onSave={handleSave}
          />
          {saving && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white text-sm">Speichern...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm w-full">
            <Ruler size={48} className="mx-auto mb-4 text-gray-700" />
            <h2 className="text-white font-medium mb-2">Foto auswählen</h2>
            <p className="text-gray-500 text-sm mb-6">
              Wähle ein Foto vom Einsatzort. Danach kannst du Linien und Maße einzeichnen.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-medium transition-colors"
              >
                <Upload size={16} />
                Foto auswählen
              </button>
              <button
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.accept = 'image/*'
                    fileRef.current.capture = 'environment'
                    fileRef.current.click()
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl py-3 text-sm font-medium transition-colors"
              >
                <Camera size={16} />
                Kamera öffnen
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
