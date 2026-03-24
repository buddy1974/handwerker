'use client'

import { Plus, Trash2 } from 'lucide-react'
import { calcLineTotal, formatEur, calcTotals } from '@/lib/utils/money'

export type LineItem = {
  title: string
  description: string
  quantity: string
  unit: string
  unitPrice: string
  discountPct: string
  taxRate: string
  isOptional?: boolean
}

const emptyItem = (): LineItem => ({
  title: '',
  description: '',
  quantity: '1',
  unit: 'Stk',
  unitPrice: '0',
  discountPct: '0',
  taxRate: '19.00',
  isOptional: false,
})

export default function LineItemsEditor({
  items,
  onChange,
}: {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}) {
  const update = (i: number, field: keyof LineItem, value: string | boolean) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    onChange(updated)
  }

  const totals = calcTotals(items)

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-mono">Pos. {i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-gray-600 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div>
            <input
              value={item.title}
              onChange={e => update(i, 'title', e.target.value)}
              placeholder="Bezeichnung *"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <input
              value={item.description}
              onChange={e => update(i, 'description', e.target.value)}
              placeholder="Beschreibung (optional)"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Menge</label>
              <input
                value={item.quantity}
                onChange={e => update(i, 'quantity', e.target.value)}
                type="number"
                step="0.001"
                min="0"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Einheit</label>
              <select
                value={item.unit}
                onChange={e => update(i, 'unit', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {['Stk', 'h', 'm', 'm²', 'm³', 'kg', 'l', 'pauschal'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Einzelpreis €</label>
              <input
                value={item.unitPrice}
                onChange={e => update(i, 'unitPrice', e.target.value)}
                type="number"
                step="0.01"
                min="0"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">MwSt %</label>
              <select
                value={item.taxRate}
                onChange={e => update(i, 'taxRate', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="19.00">19%</option>
                <option value="7.00">7%</option>
                <option value="0.00">0%</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.isOptional ?? false}
                onChange={e => update(i, 'isOptional', e.target.checked)}
                className="accent-blue-600"
              />
              <span className="text-gray-400 text-xs">Optional</span>
            </div>
            <span className="text-white text-sm font-medium">
              {formatEur(calcLineTotal(item.quantity, item.unitPrice, item.discountPct))}
            </span>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, emptyItem()])}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-700 hover:border-gray-500 rounded-xl py-3 text-gray-400 text-sm transition-colors"
      >
        <Plus size={14} />
        Position hinzufügen
      </button>

      {items.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Netto</span>
            <span className="text-white">{formatEur(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">MwSt</span>
            <span className="text-white">{formatEur(totals.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-gray-600 pt-2">
            <span className="text-white">Gesamt</span>
            <span className="text-blue-400">{formatEur(totals.total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
