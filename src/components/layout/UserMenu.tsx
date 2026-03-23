'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, ChevronDown } from 'lucide-react'

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  office: 'Büro',
  manager: 'Manager',
  worker: 'Monteur',
}

export default function UserMenu({
  firstName,
  lastName,
  role,
}: {
  firstName: string
  lastName: string
  role: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
          {firstName[0]}{lastName[0]}
        </div>
        <span className="hidden sm:block">{firstName} {lastName}</span>
        <span className="hidden sm:block text-xs text-gray-500">({roleLabel[role] ?? role})</span>
        <ChevronDown size={14} className="text-gray-500" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-9 z-20 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-white text-sm font-medium">{firstName} {lastName}</p>
              <p className="text-gray-500 text-xs">{roleLabel[role] ?? role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <LogOut size={14} />
              Abmelden
            </button>
          </div>
        </>
      )}
    </div>
  )
}
