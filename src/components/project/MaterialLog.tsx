'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Package } from 'lucide-react'

type Entry = {
  id: string
  name: string
  quantity: string
  unit: string
  unitPrice: string
  notes: string
  createdAt: string
}

export default function MaterialLog({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', quantity: '1', unit: 'Stk', unitPrice: '0', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/materials`)
    if (res.ok) setEntries(await res.json())
  }, [projectId])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await fetch(`/api/projects/${projectId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ name: '', quantity: '1', unit: 'Stk', unitPrice: '0', notes: '' })
    setOpen(false)
    await load()
    setSaving(false)
  }

  const total = entries.reduce((sum, e) => sum + parseFloat(e.quantity) * parseFloat(e.unitPrice), 0)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-gray-400" />
          <h2 className="text-sm font-medium text-white">Materialien</h2>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-lg"
        >
          <Plus size={12} /> Hinzufügen
        </button>
      </div>

      {open && (
        <div className="p-4 border-b border-gray-800 space-y-3 bg-gray-800">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Material *"
              className="col-span-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              value={form.quantity}
              onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
              type="number" step="0.001" min="0"
              placeholder="Menge"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <select
              value={form.unit}
              onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {['Stk', 'm', 'm²', 'm³', 'kg', 'l', 'Rolle', 'Paket'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <input
              value={form.unitPrice}
              onChange={e => setForm(p => ({ ...p, unitPrice: e.target.value }))}
              type="number" step="0.01" min="0"
              placeholder="Einzelpreis €"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notiz"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.name} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-1.5 text-sm">
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
            <button onClick={() => setOpen(false)} className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-800">
        {entries.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-6">Keine Materialien erfasst</p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm">{entry.name}</p>
                <p className="text-gray-500 text-xs">{entry.quantity} {entry.unit}</p>
              </div>
              <p className="text-white text-sm font-medium">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                  parseFloat(entry.quantity) * parseFloat(entry.unitPrice)
                )}
              </p>
            </div>
          ))
        )}
      </div>

      {entries.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-800 flex justify-between">
          <span className="text-gray-400 text-sm">Gesamt Material</span>
          <span className="text-white font-bold text-sm">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(total)}
          </span>
        </div>
      )}
    </div>
  )
}
