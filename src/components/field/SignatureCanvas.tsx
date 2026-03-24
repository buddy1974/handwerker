'use client'

import { useRef, useState, useEffect } from 'react'
import { RotateCcw, Check } from 'lucide-react'

export default function SignatureCanvas({
  onSave,
  onCancel,
}: {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    }
  }

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDrawing(true)
    setHasStrokes(true)
  }

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const end = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDrawing(false)
  }

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
  }

  const save = () => {
    const canvas = canvasRef.current!
    onSave(canvas.toDataURL('image/png'))
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <span className="text-white text-sm font-medium">Unterschrift Kunde</span>
        <button onClick={clear} className="flex items-center gap-1 text-gray-400 text-xs">
          <RotateCcw size={12} />
          Löschen
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full touch-none bg-white"
        style={{ height: '160px' }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={save}
          disabled={!hasStrokes}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium"
        >
          <Check size={14} />
          Unterschrift speichern
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
