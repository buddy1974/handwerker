'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt } from 'lucide-react'

export default function CreateInvoiceButton({
  offerId,
  customerId,
  projectId,
  title,
  items,
}: {
  offerId: string
  customerId: string
  projectId: string | null
  title: string
  items: {
    title: string
    description: string | null
    quantity: string | null
    unit: string | null
    unitPrice: string | null
    discountPct: string | null
    taxRate: string | null
    sortOrder: number | null
  }[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const create = async () => {
    setLoading(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId,
        customerId,
        projectId: projectId ?? undefined,
        title: `Rechnung — ${title}`,
        items: items.map(item => ({
          title: item.title,
          description: item.description ?? '',
          quantity: item.quantity ?? '1',
          unit: item.unit ?? 'Stk',
          unitPrice: item.unitPrice ?? '0',
          discountPct: item.discountPct ?? '0',
          taxRate: item.taxRate ?? '19.00',
        })),
      }),
    })
    if (res.ok) {
      const invoice = await res.json()
      router.push(`/invoices/${invoice.id}`)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0"
    >
      <Receipt size={14} />
      {loading ? '...' : 'Rechnung erstellen'}
    </button>
  )
}
