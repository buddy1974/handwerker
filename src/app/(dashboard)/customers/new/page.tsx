'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCustomerSchema } from '@/lib/validations/customer'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type FormValues = z.input<typeof createCustomerSchema>

export default function NewCustomerPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: { type: 'business', addressCountry: 'DE', tags: [] },
  })

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      setError('Fehler beim Speichern. Bitte erneut versuchen.')
      setLoading(false)
      return
    }

    const customer = await res.json()
    router.push(`/customers/${customer.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/customers" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Neuer Kunde</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Basis</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Name *</label>
              <input
                {...register('name')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Musterfirma GmbH"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Typ</label>
              <select
                {...register('type')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="business">Firma</option>
                <option value="private">Privat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Ansprechpartner</label>
              <input
                {...register('contactName')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Max Mustermann"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">E-Mail</label>
              <input
                {...register('email')}
                type="email"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="info@firma.de"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Telefon</label>
              <input
                {...register('phone')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="+49 211 123456"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Adresse</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Straße</label>
              <input
                {...register('addressStreet')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Musterstraße 1"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">PLZ</label>
              <input
                {...register('addressZip')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="40210"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Stadt</label>
              <input
                {...register('addressCity')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Düsseldorf"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Weitere Infos</h2>

          <div>
            <label className="block text-sm text-gray-300 mb-1">USt-IdNr.</label>
            <input
              {...register('vatNumber')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="DE123456789"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Notizen</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Interne Notizen..."
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 text-white font-medium rounded-lg px-6 py-2 text-sm transition-colors"
          >
            {loading ? 'Speichern...' : 'Kunde speichern'}
          </button>
          <Link
            href="/customers"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg px-6 py-2 text-sm transition-colors"
          >
            Abbrechen
          </Link>
        </div>

      </form>
    </div>
  )
}
