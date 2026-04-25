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
  const [locale, setLocale] = useState<'de' | 'en'>('de')
  const [hasDeposit, setHasDeposit] = useState(false)
  const [showAiInput, setShowAiInput] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateInvoiceInput>({
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
    fetch('/api/settings').then(r => r.json()).then(s => setLocale(s.locale ?? 'de')).catch(() => {})
  }, [])

  const generateFromAI = async () => {
    if (!aiText.trim()) return
    setAiGenerating(true)
    try {
      const res = await fetch('/api/ai/invoice-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText, locale }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.title) setValue('title', data.title)
      if (data.notes) setValue('notes', data.notes)
      if (Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items.map((item: {
          title?: string; quantity?: number; unit?: string
          unitPrice?: number; itemType?: string
        }) => ({
          title: item.title ?? '',
          description: '',
          quantity: String(item.quantity ?? 1),
          unit: item.unit ?? 'Stk',
          unitPrice: String(item.unitPrice ?? 0),
          discountPct: '0',
          taxRate: '19.00',
          itemType: item.itemType === 'flat' ? 'flat' : 'unit',
        } satisfies LineItem)))
      }
      if (data.depositAmount && Number(data.depositAmount) > 0) {
        setHasDeposit(true)
        setValue('depositAmount', String(data.depositAmount))
      }
      setShowAiInput(false)
      setAiText('')
    } catch {
      // silent fail
    } finally {
      setAiGenerating(false)
    }
  }

  const onSubmit = async (data: CreateInvoiceInput) => {
    setLoading(true)
    setError(null)
    const normalizedItems = items.map(item =>
      item.itemType === 'flat' ? { ...item, quantity: '1', discountPct: '0' } : item
    )
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, items: normalizedItems }),
    })
    if (!res.ok) { setError('Fehler beim Speichern.'); setLoading(false); return }
    const invoice = await res.json()
    router.push(`/invoices/${invoice.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-white">
          {locale === 'en' ? 'New Invoice' : 'Neue Rechnung'}
        </h1>
      </div>

      {/* AI Generate from Text */}
      <div className="mb-5">
        {!showAiInput ? (
          <button
            type="button"
            onClick={() => setShowAiInput(true)}
            className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            🤖 {locale === 'en' ? 'Generate from text' : 'Aus Text generieren'}
          </button>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-400">
              {locale === 'en'
                ? 'Describe the invoice in plain text — positions, prices, deposit, etc.'
                : 'Rechnung in Freitext beschreiben — Positionen, Preise, Anzahlung usw.'}
            </p>
            <textarea
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder={locale === 'en'
                ? 'E.g. Window foiling 123 Main St, 3 days work, materials $450, total $1200, deposit $600 received'
                : 'z.B. Fenster Folierung Bottroper Str 43, 3 Tage Arbeit, Material 450€, gesamt 1200€, Anzahlung 600 erhalten'}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={generateFromAI}
                disabled={aiGenerating || !aiText.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
              >
                {aiGenerating ? '...' : (locale === 'en' ? 'Generate' : 'Generieren')}
              </button>
              <button
                type="button"
                onClick={() => { setShowAiInput(false); setAiText('') }}
                className="bg-gray-800 text-gray-300 rounded-lg px-4 py-2 text-sm"
              >
                {locale === 'en' ? 'Cancel' : 'Abbrechen'}
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Basis</h2>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              {locale === 'en' ? 'Customer' : 'Kunde'} *
            </label>
            <select {...register('customerId')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">{locale === 'en' ? '— Select Customer —' : '— Kunde auswählen —'}</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.customerId && <p className="text-red-400 text-xs mt-1">{errors.customerId.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              {locale === 'en' ? 'Project (optional)' : 'Projekt (optional)'}
            </label>
            <select {...register('projectId')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">{locale === 'en' ? '— No Project —' : '— Kein Projekt —'}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.projectNumber} — {p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              {locale === 'en' ? 'Title' : 'Titel'} *
            </label>
            <input
              {...register('title')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder={locale === 'en' ? 'e.g. Invoice Window Foiling' : 'z.B. Rechnung Folierung Schaufenster'}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                {locale === 'en' ? 'Invoice Date' : 'Rechnungsdatum'}
              </label>
              <input {...register('issueDate')} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                {locale === 'en' ? 'Due Date' : 'Fällig am'}
              </label>
              <input {...register('dueDate')} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              {locale === 'en' ? 'Payment Terms' : 'Zahlungsbedingungen'}
            </label>
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
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {locale === 'en' ? 'Line Items' : 'Positionen'}
          </h2>
          <LineItemsEditor items={items} onChange={setItems} locale={locale} />
        </div>

        {/* Deposit section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasDeposit"
              checked={hasDeposit}
              onChange={e => setHasDeposit(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="hasDeposit" className="text-sm font-medium text-gray-300">
              {locale === 'en' ? 'Deposit received' : 'Anzahlung erhalten'}
            </label>
          </div>
          {hasDeposit && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {locale === 'en' ? 'Deposit amount' : 'Anzahlungsbetrag'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('depositAmount')}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {locale === 'en' ? 'Date received' : 'Datum'}
                </label>
                <input
                  type="date"
                  {...register('depositDate')}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {locale === 'en' ? 'Payment method' : 'Zahlungsart'}
                </label>
                <select
                  {...register('depositMethod')}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white"
                >
                  <option value="bank">{locale === 'en' ? 'Bank transfer' : 'Überweisung'}</option>
                  <option value="cash">{locale === 'en' ? 'Cash' : 'Bar'}</option>
                  <option value="paypal">PayPal</option>
                  <option value="other">{locale === 'en' ? 'Other' : 'Andere'}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 text-sm"
          >
            {loading
              ? (locale === 'en' ? 'Saving...' : 'Speichern...')
              : (locale === 'en' ? 'Save Invoice' : 'Rechnung speichern')}
          </button>
          <Link href="/invoices" className="bg-gray-800 text-gray-300 rounded-lg px-6 py-2 text-sm">
            {locale === 'en' ? 'Cancel' : 'Abbrechen'}
          </Link>
        </div>
      </form>
    </div>
  )
}
