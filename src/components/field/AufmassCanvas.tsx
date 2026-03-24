'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Minus, Type, RotateCcw, Save, Trash2 } from 'lucide-react'
import type { Annotation } from '@/lib/validations/measurement'

type Tool = 'line' | 'text'

type Point = { x: number; y: number }

export default function AufmassCanvas({
  imageUrl,
  initialAnnotations = [],
  onSave,
}: {
  imageUrl: string
  initialAnnotations?: Annotation[]
  onSave: (annotations: Annotation[], dataUrl: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
  const [tool, setTool] = useState<Tool>('line')
  const [drawing, setDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [pendingAnnotation, setPendingAnnotation] = useState<Annotation | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage(img)
    img.src = imageUrl
  }, [imageUrl])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const scale = Math.min(canvas.width / image.width, canvas.height / image.height)
    const offsetX = (canvas.width - image.width * scale) / 2
    const offsetY = (canvas.height - image.height * scale) / 2

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, offsetX, offsetY, image.width * scale, image.height * scale)

    annotations.forEach(ann => {
      ctx.strokeStyle = ann.color || '#ff0000'
      ctx.fillStyle = ann.color || '#ff0000'
      ctx.lineWidth = 2
      ctx.font = 'bold 14px Arial'

      if (ann.type === 'line' && ann.points.length >= 4) {
        const [x1, y1, x2, y2] = ann.points
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        const tw = ctx.measureText(ann.label).width
        ctx.fillRect(mx - tw / 2 - 4, my - 16, tw + 8, 20)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(ann.label, mx - tw / 2, my - 2)

        ctx.strokeStyle = ann.color || '#ff0000'
        ctx.fillStyle = ann.color || '#ff0000'
        ctx.beginPath()
        ctx.arc(x1, y1, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x2, y2, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      if (ann.type === 'text' && ann.points.length >= 2) {
        const [x, y] = ann.points
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        const tw = ctx.measureText(ann.label).width
        ctx.fillRect(x - 4, y - 16, tw + 8, 20)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(ann.label, x, y - 2)
      }
    })

    if (drawing && startPoint && currentPoint && tool === 'line') {
      ctx.strokeStyle = '#ff0000'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(startPoint.x, startPoint.y)
      ctx.lineTo(currentPoint.x, currentPoint.y)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [image, annotations, drawing, startPoint, currentPoint, tool])

  useEffect(() => {
    redraw()
  }, [redraw])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
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

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const pos = getPos(e)
    setDrawing(true)
    setStartPoint(pos)
    setCurrentPoint(pos)
  }

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!drawing) return
    setCurrentPoint(getPos(e))
  }

  const handleEnd = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!drawing || !startPoint) return
    setDrawing(false)
    const pos = getPos(e)

    if (tool === 'line') {
      const dx = pos.x - startPoint.x
      const dy = pos.y - startPoint.y
      if (Math.sqrt(dx * dx + dy * dy) < 10) return
      const ann: Annotation = {
        type: 'line',
        points: [startPoint.x, startPoint.y, pos.x, pos.y],
        label: '',
        unit: 'm',
        color: '#ff0000',
      }
      setPendingAnnotation(ann)
      setShowLabelInput(true)
    }

    if (tool === 'text') {
      const ann: Annotation = {
        type: 'text',
        points: [pos.x, pos.y],
        label: '',
        unit: '',
        color: '#ff0000',
      }
      setPendingAnnotation(ann)
      setShowLabelInput(true)
    }
  }

  const confirmLabel = () => {
    if (!pendingAnnotation || !pendingLabel.trim()) {
      setShowLabelInput(false)
      setPendingLabel('')
      return
    }
    const finalAnn = { ...pendingAnnotation, label: pendingLabel.trim() }
    setAnnotations(prev => [...prev, finalAnn])
    setShowLabelInput(false)
    setPendingLabel('')
    setPendingAnnotation(null)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onSave(annotations, dataUrl)
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex items-center gap-2 p-3 bg-gray-900 border-b border-gray-800 flex-wrap">
        <button
          onClick={() => setTool('line')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            tool === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'
          }`}
        >
          <Minus size={14} />
          Linie
        </button>
        <button
          onClick={() => setTool('text')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            tool === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'
          }`}
        >
          <Type size={14} />
          Text
        </button>
        <button
          onClick={() => setAnnotations(prev => prev.slice(0, -1))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-300"
        >
          <RotateCcw size={14} />
          Rückgängig
        </button>
        <button
          onClick={() => setAnnotations([])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-red-400"
        >
          <Trash2 size={14} />
          Alles löschen
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-600 text-white ml-auto"
        >
          <Save size={14} />
          Speichern
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        {!image && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            Bild wird geladen...
          </div>
        )}
      </div>

      {showLabelInput && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-full max-w-sm">
            <p className="text-white text-sm font-medium mb-3">
              {tool === 'line' ? 'Maß eingeben' : 'Text eingeben'}
            </p>
            <input
              autoFocus
              value={pendingLabel}
              onChange={e => setPendingLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmLabel()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 mb-3"
              placeholder={tool === 'line' ? 'z.B. 4.5m oder 120cm' : 'Text...'}
            />
            <div className="flex gap-2">
              <button onClick={confirmLabel} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm">
                OK
              </button>
              <button
                onClick={() => { setShowLabelInput(false); setPendingLabel('') }}
                className="flex-1 bg-gray-800 text-gray-300 rounded-lg py-2 text-sm"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
