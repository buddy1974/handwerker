'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOfferSchema } from '@/lib/validations/offer'
import type { z } from 'zod'
type CreateOfferInput = z.input<typeof createOfferSchema>
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import LineItemsEditor, { type LineItem } from '@/components/forms/LineItemsEditor'

type Customer = { id: string; name: string }
type Project = { id: string; title: string; projectNumber: string }

export default function NewOfferPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [items, setItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locale, setLocale] = useState<'de' | 'en'>('de')
  const [showAiInput, setShowAiInput] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateOfferInput>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
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
      setShowAiInput(false)
      setAiText('')
    } catch {
      // silent fail
    } finally {
      setAiGenerating(false)
    }
  }

  const onSubmit = async (data: CreateOfferInput) => {
    setLoading(true)
    setError(null)
    const normalizedItems = items.map(item =>
      item.itemType === 'flat' ? { ...item, quantity: '1', discountPct: '0' } : item
    )
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, items: normalizedItems }),
    })
    if (!res.ok) { setError('Fehler beim Speichern.'); setLoading(false); return }
    const offer = await res.json()
    router.push(`/offers/${offer.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/offers" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-white">
          {locale === 'en' ? 'New Quote' : 'Neues Angebot'}
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
                ? 'Describe the quote in plain text — positions, prices, etc.'
                : 'Angebot in Freitext beschreiben — Positionen, Preise usw.'}
            </p>
            <textarea
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder={locale === 'en'
                ? 'E.g. Window foiling 3 days labor + materials $450, total $1200'
                : 'z.B. Fenster Folierung 3 Tage Arbeit + Material 450€, gesamt 1200€'}
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
              placeholder={locale === 'en' ? 'e.g. Quote Window Foiling' : 'z.B. Angebot Folierung Schaufenster'}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                {locale === 'en' ? 'Date' : 'Datum'}
              </label>
              <input {...register('issueDate')} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                {locale === 'en' ? 'Valid Until' : 'Gültig bis'}
              </label>
              <input {...register('validUntil')} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {locale === 'en' ? 'Line Items' : 'Positionen'}
          </h2>
          <LineItemsEditor items={items} onChange={setItems} locale={locale} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {locale === 'en' ? 'Text' : 'Texte'}
          </h2>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              {locale === 'en' ? 'Intro Text' : 'Einleitungstext'}
            </label>
            <textarea {...register('introText')} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder={locale === 'en' ? 'We are pleased to present the following quote...' : 'Wir freuen uns, Ihnen folgendes Angebot zu unterbreiten...'} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              {locale === 'en' ? 'Closing Text' : 'Schlusstext'}
            </label>
            <textarea {...register('outroText')} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder={locale === 'en' ? 'Please don\'t hesitate to contact us with any questions...' : 'Bei Fragen stehen wir Ihnen gerne zur Verfügung...'} />
          </div>
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
              : (locale === 'en' ? 'Save Quote' : 'Angebot speichern')}
          </button>
          <Link href="/offers" className="bg-gray-800 text-gray-300 rounded-lg px-6 py-2 text-sm">
            {locale === 'en' ? 'Cancel' : 'Abbrechen'}
          </Link>
        </div>
      </form>
    </div>
  )
}
