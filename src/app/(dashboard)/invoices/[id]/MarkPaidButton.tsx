'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const markPaid = async () => {
    if (!confirm('Rechnung als bezahlt markieren?')) return
    setLoading(true)
    await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paidAt: new Date().toISOString() }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={markPaid}
      disabled={loading}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0"
    >
      <CheckCircle size={14} />
      {loading ? '...' : 'Als bezahlt markieren'}
    </button>
  )
}
