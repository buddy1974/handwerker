'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

export default function SendEmailButton({
  invoiceId,
  defaultEmail,
}: {
  invoiceId: string
  defaultEmail?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    if (!email) return
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/invoices/${invoiceId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setSent(true)
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Fehler beim Senden')
    }
    setLoading(false)
  }

  if (sent) return (
    <span className="flex items-center gap-1.5 text-green-400 text-sm px-3 py-2">
      ✓ Gesendet
    </span>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0"
      >
        <Send size={14} />
        Senden
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-white font-medium mb-4">Rechnung per E-Mail senden</h3>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="kunde@firma.de"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 mb-3"
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={send}
                disabled={loading || !email}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm"
              >
                {loading ? 'Senden...' : 'Senden'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
