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
  addressState: string
  addressCountry: string
  vatNumber: string
  trade: string
  locale: string
  invoicePrefix: string
  offerPrefix: string
  iban: string
  bic: string
  bankName: string
  logoUrl: string
  brandColor: string
}

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],
  ['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],
  ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],
  ['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],
  ['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
  ['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
  ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
  ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],
  ['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],
  ['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],
  ['WI','Wisconsin'],['WY','Wyoming'],
] as const

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    email: '',
    phone: '',
    addressStreet: '',
    addressCity: '',
    addressZip: '',
    addressState: '',
    addressCountry: 'DE',
    vatNumber: '',
    trade: '',
    locale: 'de',
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

  const isEn = settings.locale === 'en'

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

  if (fetching) return <div className="text-gray-500 text-sm">{isEn ? 'Loading...' : 'Laden...'}</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Building2 size={20} className="text-gray-400" />
        <h1 className="text-2xl font-bold text-white">{isEn ? 'Settings' : 'Einstellungen'}</h1>
      </div>

      <div className="space-y-5">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {isEn ? 'Company Details' : 'Firmendaten'}
          </h2>
          {field('name', isEn ? 'Company Name *' : 'Firmenname *', isEn ? 'Acme Inc.' : 'Musterfirma GmbH')}
          <div className="grid grid-cols-2 gap-4">
            {field('email', 'Email', isEn ? 'info@company.com' : 'info@firma.de', 'email')}
            {field('phone', isEn ? 'Phone' : 'Telefon', isEn ? '+1 212 555 0100' : '+49 211 123456')}
          </div>
          {field('vatNumber', isEn ? 'Tax ID / EIN' : 'USt-IdNr. / Steuernummer', isEn ? '12-3456789' : 'DE123456789')}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              {isEn ? 'Trade / Industry' : 'Gewerk / Branche'}
            </label>
            <select
              value={settings.trade}
              onChange={e => setSettings(prev => ({ ...prev, trade: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">{isEn ? '— Please select —' : '— Bitte wählen —'}</option>
              <option value="Maler">Maler &amp; Lackierer</option>
              <option value="Elektriker">Elektriker</option>
              <option value="Sanitär">Sanitär &amp; Heizung</option>
              <option value="Schreiner">Schreiner &amp; Tischler</option>
              <option value="Fliesenleger">Fliesenleger</option>
              <option value="Dachdecker">Dachdecker</option>
              <option value="Gerüstbauer">Gerüstbauer</option>
              <option value="Bodenleger">Bodenleger</option>
              <option value="Metallbauer">Metallbauer &amp; Schlosser</option>
              <option value="Garten">Garten &amp; Landschaftsbau</option>
              <option value="Folierung">Folierung &amp; Beschriftung</option>
              <option value="Reinigung">Gebäudereinigung</option>
              <option value="Sonstiges">Sonstiges Handwerk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sprache / Language</label>
            <select
              value={settings.locale}
              onChange={e => setSettings(s => ({ ...s, locale: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-blue-500"
            >
              <option value="de">🇩🇪 Deutsch</option>
              <option value="en">🇺🇸 English</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Affects currency, date format, and UI language</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {isEn ? 'Address' : 'Adresse'}
          </h2>
          {field('addressStreet', isEn ? 'Street' : 'Straße', isEn ? '123 Main St' : 'Musterstraße 1')}
          <div className="grid grid-cols-2 gap-4">
            {field('addressZip', isEn ? 'ZIP Code' : 'PLZ', isEn ? '90210' : '40210')}
            {field('addressCity', isEn ? 'City' : 'Stadt', isEn ? 'Los Angeles' : 'Düsseldorf')}
          </div>
          {isEn && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">State</label>
              <select
                value={settings.addressState ?? ''}
                onChange={e => setSettings(s => ({ ...s, addressState: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">— Select State —</option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {isEn ? 'Payment Details (for Invoices)' : 'Bankdaten (für Rechnungen)'}
          </h2>
          {field('bankName', isEn ? 'Bank Name' : 'Bankname', isEn ? 'Chase Bank' : 'Deutsche Bank')}
          {field('iban', isEn ? 'Account Number' : 'IBAN', isEn ? '0001234567' : 'DE89 3704 0044 0532 0130 00')}
          {field('bic', isEn ? 'Routing Number' : 'BIC', isEn ? '021000021' : 'COBADEFFXXX')}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {isEn ? 'Document Numbering' : 'Dokumentennummern'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {field('invoicePrefix', isEn ? 'Invoice Prefix' : 'Rechnungsprefix', 'RE')}
            {field('offerPrefix', isEn ? 'Quote Prefix' : 'Angebotsprefix', 'AN')}
          </div>
          <p className="text-gray-500 text-xs">
            {isEn ? 'Example: INV → INV-0001, QT → QT-0001' : 'Beispiel: RE → RE-0001, AN → AN-0001'}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Branding</h2>
          {field('logoUrl', 'Logo URL', 'https://...')}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              {isEn ? 'Brand Color' : 'Markenfarbe'}
            </label>
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
            <p className="text-green-400 text-sm">
              {isEn ? '✓ Settings saved' : '✓ Einstellungen gespeichert'}
            </p>
          </div>
        )}

        <div className="pb-8">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 text-sm transition-colors"
          >
            <Save size={14} />
            {loading
              ? (isEn ? 'Saving...' : 'Speichern...')
              : (isEn ? 'Save Settings' : 'Einstellungen speichern')}
          </button>
        </div>
      </div>
    </div>
  )
}
