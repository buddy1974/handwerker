'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createReportSchema } from '@/lib/validations/report'
import type { z } from 'zod'

type FormValues = z.input<typeof createReportSchema>
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import AIWriteButton from '@/components/ui/AIWriteButton'
import { getChecklistForTrade } from '@/lib/trade-checklists'

const SignatureCanvas = dynamic(() => import('@/components/field/SignatureCanvas'), { ssr: false })

type Project = { id: string; title: string; projectNumber: string }

export default function NewReportPage() {
  const router = useRouter()
  const [projectsList, setProjectsList] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSignature, setShowSignature] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [locale, setLocale] = useState<'de' | 'en'>('de')
  const [trade, setTrade] = useState<string | null>(null)
  const [checklistItems, setChecklistItems] = useState(
    getChecklistForTrade(null).map(label => ({ label, isChecked: false, notes: '' }))
  )
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [checklistLoading, setChecklistLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      workDate: new Date().toISOString().split('T')[0],
      customerPresent: false,
      checklistItems: [],
    },
  })

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjectsList).catch(() => {})
    fetch('/api/settings')
      .then(r => r.json())
      .then(settings => {
        const t = settings.trade ?? null
        setTrade(t)
        setLocale(settings.locale === 'en' ? 'en' : 'de')
        setChecklistItems(getChecklistForTrade(t).map(label => ({ label, isChecked: false, notes: '' })))
      })
      .catch(() => {})
  }, [])

  const generateChecklist = async () => {
    const selectedId = watch('projectId')
    const selectedProject = projectsList.find(p => p.id === selectedId)
    setChecklistLoading(true)
    try {
      const res = await fetch('/api/ai/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: selectedProject?.title ?? '',
          projectDescription: watch('workDone'),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setChecklistItems(data.items.map((label: string) => ({ label, isChecked: false, notes: '' })))
      }
    } catch {
      // silent fail
    } finally {
      setChecklistLoading(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, checklistItems }),
    })

    if (!res.ok) {
      setError(locale === 'en' ? 'Error saving report.' : 'Fehler beim Speichern.')
      setLoading(false)
      return
    }

    const report = await res.json()

    if (signatureDataUrl) {
      await fetch(`/api/reports/${report.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl,
          customerName: data.customerName,
        }),
      })
    }

    router.push(`/reports/${report.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reports" className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">{locale === 'en' ? 'New Report' : 'Neuer Bericht'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">{locale === 'en' ? 'Basics' : 'Basis'}</h2>
          <div>
            <label className="block text-sm text-gray-300 mb-1">{locale === 'en' ? 'Project *' : 'Projekt *'}</label>
            <select {...register('projectId')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">{locale === 'en' ? '— Select project —' : '— Projekt auswählen —'}</option>
              {projectsList.map(p => <option key={p.id} value={p.id}>{p.projectNumber} — {p.title}</option>)}
            </select>
            {errors.projectId && <p className="text-red-400 text-xs mt-1">{errors.projectId.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Titel *</label>
            <input {...register('title')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder="z.B. Montage abgeschlossen" />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Datum</label>
            <input {...register('workDate')} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">{locale === 'en' ? 'Work Description' : 'Arbeitsbeschreibung'}</h2>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Beschreibung</label>
            <textarea {...register('description')} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder="Was wurde gemacht?" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm text-gray-300">Durchgeführte Arbeiten</label>
              <AIWriteButton
                fieldValue={watch('workDone') ?? ''}
                field="workDone"
                onResult={text => setValue('workDone', text)}
              />
            </div>
            <textarea {...register('workDone')} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder="Stichworte eingeben, KI formuliert aus..." />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Verwendete Materialien</label>
            <textarea {...register('materialsUsed')} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder="Materialien, Mengen..." />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nächste Schritte</label>
            <textarea {...register('nextSteps')} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder="Was muss noch gemacht werden?" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Checkliste{trade ? ` (${trade})` : ''}
            </h2>
            <button
              type="button"
              onClick={generateChecklist}
              disabled={checklistLoading}
              className="flex items-center gap-1.5 text-xs bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {checklistLoading ? '⏳ Generiere...' : '🤖 KI-Checkliste'}
            </button>
          </div>
          {checklistItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.isChecked}
                onChange={e => {
                  const updated = [...checklistItems]
                  updated[i] = { ...updated[i], isChecked: e.target.checked }
                  setChecklistItems(updated)
                }}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-white text-sm flex-1">{item.label}</span>
              <button type="button" onClick={() => setChecklistItems(prev => prev.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              value={newChecklistItem}
              onChange={e => setNewChecklistItem(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (newChecklistItem.trim()) {
                    setChecklistItems(prev => [...prev, { label: newChecklistItem.trim(), isChecked: false, notes: '' }])
                    setNewChecklistItem('')
                  }
                }
              }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="Neuer Punkt..."
            />
            <button
              type="button"
              onClick={() => {
                if (newChecklistItem.trim()) {
                  setChecklistItems(prev => [...prev, { label: newChecklistItem.trim(), isChecked: false, notes: '' }])
                  setNewChecklistItem('')
                }
              }}
              className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">{locale === 'en' ? 'Customer On-Site' : 'Kunde vor Ort'}</h2>
          <div className="flex items-center gap-3">
            <input {...register('customerPresent')} type="checkbox" className="w-4 h-4 rounded accent-blue-600" />
            <label className="text-white text-sm">{locale === 'en' ? 'Customer was present' : 'Kunde war anwesend'}</label>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">{locale === 'en' ? 'Contact Name' : 'Name Ansprechpartner'}</label>
            <input {...register('customerName')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" placeholder={locale === 'en' ? 'John Smith' : 'Max Mustermann'} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">{locale === 'en' ? 'Signature' : 'Unterschrift'}</h2>
          {signatureDataUrl ? (
            <div>
              <img src={signatureDataUrl} alt="Unterschrift" className="border border-gray-700 rounded-lg max-h-24 bg-white" />
              <button type="button" onClick={() => setSignatureDataUrl(null)} className="text-red-400 text-xs mt-2">
                {locale === 'en' ? 'Remove signature' : 'Unterschrift löschen'}
              </button>
            </div>
          ) : showSignature ? (
            <SignatureCanvas
              onSave={dataUrl => { setSignatureDataUrl(dataUrl); setShowSignature(false) }}
              onCancel={() => setShowSignature(false)}
            />
          ) : (
            <button type="button" onClick={() => setShowSignature(true)} className="w-full border border-dashed border-gray-700 rounded-xl py-4 text-gray-400 text-sm hover:border-gray-500 transition-colors">
              + {locale === 'en' ? 'Add signature' : 'Unterschrift hinzufügen'}
            </button>
          )}
        </div>

        {error && <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}

        <div className="flex gap-3 pb-8">
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 text-sm">
            {loading ? (locale === 'en' ? 'Saving...' : 'Speichern...') : (locale === 'en' ? 'Save Report' : 'Bericht speichern')}
          </button>
          <Link href="/reports" className="bg-gray-800 text-gray-300 rounded-lg px-6 py-2 text-sm">
            {locale === 'en' ? 'Cancel' : 'Abbrechen'}
          </Link>
        </div>

      </form>
    </div>
  )
}
