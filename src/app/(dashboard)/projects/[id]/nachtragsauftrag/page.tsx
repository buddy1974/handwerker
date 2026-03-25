'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { LineItem } from '@/components/forms/LineItemsEditor'
import { calcTotals, formatEur } from '@/lib/utils/money'

const LineItemsEditor = dynamic(() => import('@/components/forms/LineItemsEditor'), { ssr: false })
const SignatureCanvas = dynamic(() => import('@/components/field/SignatureCanvas'), { ssr: false })

export default function NachtragsauftragPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [items, setItems] = useState<LineItem[]>([])
  const [title, setTitle] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [showSignature, setShowSignature] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(p => setCustomerId(p.customerId))
      .catch(() => {})
  }, [projectId])

  const totals = calcTotals(items)

  const onSubmit = async () => {
    if (!title.trim() || !customerId) { setError('Titel und Kunde erforderlich'); return }
    setLoading(true)
    setError(null)

    const offerRes = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        projectId,
        title: `Nachtragsauftrag: ${title}`,
        items,
        introText: `Nachtragsauftrag für zusätzliche Arbeiten.\nKunde vor Ort: ${customerName}`,
      }),
    })

    if (!offerRes.ok) { setError('Fehler beim Speichern'); setLoading(false); return }
    const offer = await offerRes.json()

    if (signatureDataUrl) {
      const report = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: `Nachtragsauftrag: ${title}`,
          workDate: new Date().toISOString().split('T')[0],
          customerPresent: true,
          customerName,
          workDone: title,
          checklistItems: [],
        }),
      }).then(r => r.json())

      if (report.id) {
        await fetch(`/api/reports/${report.id}/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signatureDataUrl, customerName }),
        })
      }
    }

    router.push(`/offers/${offer.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${projectId}`} className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nachtragsauftrag</h1>
          <p className="text-gray-400 text-sm">Zusätzliche Arbeiten vor Ort</p>
        </div>
      </div>

      <div className="space-y-5">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Details</h2>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Beschreibung der Zusatzarbeiten *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="z.B. Zusätzliche Wandreparatur entdeckt"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Ansprechpartner vor Ort</label>
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="Max Mustermann"
            />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Positionen</h2>
          <LineItemsEditor items={items} onChange={setItems} />
        </div>

        {items.length > 0 && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 flex justify-between items-center">
            <span className="text-blue-300 text-sm">Gesamtbetrag Nachtrag</span>
            <span className="text-white font-bold text-lg">{formatEur(totals.total)}</span>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Unterschrift Kunde</h2>
          {signatureDataUrl ? (
            <div>
              <img src={signatureDataUrl} alt="Unterschrift" className="border border-gray-700 rounded-lg max-h-24 bg-white" />
              <button onClick={() => setSignatureDataUrl(null)} className="text-red-400 text-xs mt-2">Löschen</button>
            </div>
          ) : showSignature ? (
            <SignatureCanvas
              onSave={url => { setSignatureDataUrl(url); setShowSignature(false) }}
              onCancel={() => setShowSignature(false)}
            />
          ) : (
            <button
              onClick={() => setShowSignature(true)}
              className="w-full border border-dashed border-gray-700 rounded-xl py-4 text-gray-400 text-sm hover:border-gray-500"
            >
              + Unterschrift hinzufügen
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 text-sm"
          >
            {loading ? 'Speichern...' : 'Als Angebot speichern'}
          </button>
          <Link href={`/projects/${projectId}`} className="bg-gray-800 text-gray-300 rounded-lg px-6 py-2 text-sm">
            Abbrechen
          </Link>
        </div>
      </div>
    </div>
  )
}
