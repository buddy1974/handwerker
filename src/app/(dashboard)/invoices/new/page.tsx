'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createInvoiceSchema } from '@/lib/validations/invoice'
import type { z } from 'zod'
type CreateInvoiceInput = z.input<typeof createInvoiceSchema>
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import LineItemsEditor, { type LineItem } from '@/components/forms/LineItemsEditor'

type Customer = { id: string; name: string }
type Project = { id: string; title: string; projectNumber: string }

export default function NewInvoicePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [items, setItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      paymentTerms: '14 Tage netto',
      currency: 'EUR',
      items: [],
    },
  })

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => {})
    fetch('/api/projects').then(r => r.json()).then(setProjects).catch(() => {})
  }, [])

  const onSubmit = async (data: CreateInvoiceInput) => {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, items }),
    })
    if (!res.ok) { setError('Fehler beim Speichern.'); setLoading(false); return }
    const invoice = await res.json()
    router.push(`/invoices/${invoice.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-white">Neue Rechnung</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Basis</h2>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Kunde *</label>
            <select {...register('customerId')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">— Kunde auswählen —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.customerId && <p className="text-red-400 text-xs mt-1">{errors.customerId.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Projekt (optional)</label>
            <select {...register('projectId')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">— Kein Projekt —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.projectNumber} — {p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Titel *</label>
            <input {...register('title')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="z.B. Rechnung Folierung Schaufenster" />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Rechnungsdatum</label>
              <input {...register('issueDate')} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Fällig am</label>
              <input {...register('dueDate')} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Zahlungsbedingungen</label>
            <input {...register('paymentTerms')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">IBAN</label>
              <input {...register('iban')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="DE89 3704 0044 0532 0130 00" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">BIC</label>
              <input {...register('bic')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="COBADEFFXXX" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Positionen</h2>
          <LineItemsEditor items={items} onChange={setItems} />
        </div>

        {error && <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}

        <div className="flex gap-3 pb-8">
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 text-sm">
            {loading ? 'Speichern...' : 'Rechnung speichern'}
          </button>
          <Link href="/invoices" className="bg-gray-800 text-gray-300 rounded-lg px-6 py-2 text-sm">Abbrechen</Link>
        </div>
      </form>
    </div>
  )
}
