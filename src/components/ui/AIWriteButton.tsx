'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export default function AIWriteButton({
  fieldValue,
  field,
  onResult,
}: {
  fieldValue: string
  field: string
  onResult: (text: string) => void
}) {
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!fieldValue.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/report-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: fieldValue, field }),
      })
      if (res.ok) {
        const { text } = await res.json()
        onResult(text)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading || !fieldValue.trim()}
      title="Mit KI ausformulieren"
      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-40 transition-colors px-2 py-1 rounded-lg hover:bg-purple-950"
    >
      <Sparkles size={12} className={loading ? 'animate-pulse' : ''} />
      {loading ? 'KI schreibt...' : 'KI'}
    </button>
  )
}
