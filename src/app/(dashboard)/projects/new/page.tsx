'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProjectSchema } from '@/lib/validations/project'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AddressAutocomplete from '@/components/ui/AddressAutocomplete'
import OCRProjectImport from '@/components/field/OCRProjectImport'

type Customer = { id: string; name: string }
type FormValues = z.input<typeof createProjectSchema>

export default function NewProjectPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [customersList, setCustomersList] = useState<Customer[]>([])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { status: 'draft', priority: 2, tags: [] },
  })

  const [streetValue, setStreetValue] = useState('')

  const handleCustomerAutoCreated = (id: string, name: string) => {
    setCustomersList(prev => {
      if (prev.find(c => c.id === id)) return prev
      return [...prev, { id, name }]
    })
    setValue('customerId', id)
  }

  type OCRData = {
    projectTitle?: string | null
    projectDescription?: string | null
    startDate?: string | null
    endDate?: string | null
    addressStreet?: string | null
    addressCity?: string | null
    addressZip?: string | null
  }

  const handleOCRImport = (data: OCRData) => {
    if (data.projectTitle) setValue('title', data.projectTitle)
    if (data.projectDescription) setValue('description', data.projectDescription)
    if (data.startDate) setValue('startDate', data.startDate)
    if (data.endDate) setValue('endDate', data.endDate)
    if (data.addressStreet) {
      setStreetValue(data.addressStreet)
      setValue('locationStreet', data.addressStreet)
    }
    if (data.addressCity) setValue('locationCity', data.addressCity)
    if (data.addressZip) setValue('locationZip', data.addressZip)
  }

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => { setCustomersList(Array.isArray(data) ? data : []) })
      .catch(() => {})
  }, [])

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      setError('Fehler beim Speichern. Bitte erneut versuchen.')
      setLoading(false)
      return
    }

    const project = await res.json()
    router.push(`/projects/${project.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Neues Projekt</h1>
      </div>

      <OCRProjectImport
        onImport={handleOCRImport}
        onCustomerAutoCreated={handleCustomerAutoCreated}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Basis</h2>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Kunde *</label>
            <select
              {...register('customerId')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
            >
              <option value="">— Kunde auswählen —</option>
              {customersList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.customerId && <p className="text-red-400 text-xs mt-1">{errors.customerId.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Projekttitel *</label>
            <input
              {...register('title')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
              placeholder="z.B. Folierung Schaufenster Hauptstr. 5"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
              >
                <option value="draft">Entwurf</option>
                <option value="active">Aktiv</option>
                <option value="paused">Pausiert</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Abgebrochen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Priorität</label>
              <select
                {...register('priority')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
              >
                <option value={1}>Niedrig</option>
                <option value={2}>Normal</option>
                <option value={3}>Hoch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Beschreibung</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Projektbeschreibung..."
            />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Einsatzort</h2>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Bezeichnung</label>
            <input
              {...register('locationName')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
              placeholder="z.B. Filiale Nord"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Straße</label>
              <AddressAutocomplete
                value={streetValue}
                onChange={val => {
                  setStreetValue(val)
                  setValue('locationStreet', val)
                }}
                onSelect={result => {
                  setStreetValue(result.street || result.display)
                  setValue('locationStreet', result.street || result.display)
                  setValue('locationCity', result.city)
                  setValue('locationZip', result.zip)
                }}
                placeholder="Musterstraße 1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">PLZ</label>
              <input
                {...register('locationZip')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
                placeholder="40210"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Stadt</label>
              <input
                {...register('locationCity')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
                placeholder="Düsseldorf"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Zeitraum</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Startdatum</label>
              <input
                {...register('startDate')}
                type="date"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Enddatum</label>
              <input
                {...register('endDate')}
                type="date"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Geschätzte Stunden</label>
              <input
                {...register('estimatedHours')}
                type="number"
                step="0.5"
                min="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-blue-500"
                placeholder="8"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Wartungsvertrag</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Wiederholung</label>
              <select
                {...register('recurringInterval')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Kein Wartungsvertrag</option>
                <option value="monthly">Monatlich</option>
                <option value="quarterly">Vierteljährlich</option>
                <option value="yearly">Jährlich</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Vertragsende (optional)</label>
              <input
                type="date"
                {...register('recurringEndDate')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 text-white font-medium rounded-lg px-6 py-2 text-sm transition-colors"
          >
            {loading ? 'Speichern...' : 'Projekt speichern'}
          </button>
          <Link
            href="/projects"
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg px-6 py-2 text-sm transition-colors"
          >
            Abbrechen
          </Link>
        </div>

      </form>
    </div>
  )
}
