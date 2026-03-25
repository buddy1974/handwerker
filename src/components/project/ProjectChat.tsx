'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send } from 'lucide-react'

type Message = {
  id: string
  message: string
  createdAt: string
  user: { id: string; firstName: string; lastName: string; role: string } | null
}

export default function ProjectChat({
  projectId,
  currentUserId,
}: {
  projectId: string
  currentUserId: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/messages`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
  }, [projectId])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    setSending(true)
    await fetch(`/api/projects/${projectId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.trim() }),
    })
    setInput('')
    await load()
    setSending(false)
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })

  return (
    <div className="flex flex-col h-80 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-medium text-white">Projektchat</h2>
        <span className="text-xs text-gray-500">{messages.length} Nachrichten</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-8">Noch keine Nachrichten</p>
        ) : (
          messages.map(msg => {
            const isOwn = msg.user?.id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isOwn && (
                    <span className="text-xs text-gray-500 mb-1 ml-1">
                      {msg.user?.firstName} {msg.user?.lastName}
                    </span>
                  )}
                  <div className={`px-3 py-2 rounded-xl text-sm ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-white rounded-bl-sm'
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 mx-1">
                    {formatDate(msg.createdAt)} {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-800 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Nachricht..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
