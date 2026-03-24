'use client'

import { useState, useEffect } from 'react'
import { Building2, Save } from 'lucide-react'

type CompanySettings = {
  name: string
  email: string
  phone: string
  addressStreet: string
  addressCity: string
  addressZip: string
  addressCountry: string
  vatNumber: string
  invoicePrefix: string
  offerPrefix: string
  iban: string
  bic: string
  bankName: string
  logoUrl: string
  brandColor: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    email: '',
    phone: '',
    addressStreet: '',
    addressCity: '',
    addressZip: '',
    addressCountry: 'DE',
    vatNumber: '',
    invoicePrefix: 'RE',
    offerPrefix: 'AN',
    iban: '',
    bic: '',
    bankName: '',
    logoUrl: '',
    brandColor: '#1a56db',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(prev => ({ ...prev, ...data }))
        }
        setFetching(false)
      })
      .catch(() => setFetching(false))
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  const field = (key: keyof CompanySettings, label: string, placeholder?: string, type = 'text') => (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={settings[key]}
        onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  )

  if (fetching) return <div className="text-gray-500 text-sm">Laden...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Building2 size={20} className="text-gray-400" />
        <h1 className="text-2xl font-bold text-white">Einstellungen</h1>
      </div>

      <div className="space-y-5">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Firmendaten</h2>
          {field('name', 'Firmenname *', 'Musterfirma GmbH')}
          <div className="grid grid-cols-2 gap-4">
            {field('email', 'E-Mail', 'info@firma.de', 'email')}
            {field('phone', 'Telefon', '+49 211 123456')}
          </div>
          {field('vatNumber', 'USt-IdNr. / Steuernummer', 'DE123456789')}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Adresse</h2>
          {field('addressStreet', 'Straße', 'Musterstraße 1')}
          <div className="grid grid-cols-2 gap-4">
            {field('addressZip', 'PLZ', '40210')}
            {field('addressCity', 'Stadt', 'Düsseldorf')}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Bankdaten (für Rechnungen)</h2>
          {field('bankName', 'Bank', 'Deutsche Bank')}
          {field('iban', 'IBAN', 'DE89 3704 0044 0532 0130 00')}
          {field('bic', 'BIC', 'COBADEFFXXX')}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Dokumentennummern</h2>
          <div className="grid grid-cols-2 gap-4">
            {field('invoicePrefix', 'Rechnungsprefix', 'RE')}
            {field('offerPrefix', 'Angebotsprefix', 'AN')}
          </div>
          <p className="text-gray-500 text-xs">Beispiel: RE → RE-0001, AN → AN-0001</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Branding</h2>
          {field('logoUrl', 'Logo URL', 'https://...')}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Markenfarbe</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.brandColor}
                onChange={e => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-white text-sm font-mono">{settings.brandColor}</span>
            </div>
          </div>
        </div>

        {saved && (
          <div className="bg-green-950 border border-green-800 rounded-lg px-4 py-3">
            <p className="text-green-400 text-sm">✓ Einstellungen gespeichert</p>
          </div>
        )}

        <div className="pb-8">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 text-sm transition-colors"
          >
            <Save size={14} />
            {loading ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
