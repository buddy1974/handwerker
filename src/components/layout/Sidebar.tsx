'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FolderOpen, Clock,
  FileText, Receipt, FilePlus, Settings, Tablet, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Kunden', icon: Users },
  { href: '/projects', label: 'Projekte', icon: FolderOpen },
  { href: '/time', label: 'Zeiterfassung', icon: Clock },
  { href: '/reports', label: 'Berichte', icon: FileText },
  { href: '/offers', label: 'Angebote', icon: FilePlus },
  { href: '/invoices', label: 'Rechnungen', icon: Receipt },
]

const bottomNav = [
  { href: '/field', label: 'Feldmodus', icon: Tablet },
  { href: '/settings', label: 'Einstellungen', icon: Settings },
]

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              isActive(href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-2 py-4 border-t border-gray-800 space-y-0.5">
        {bottomNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <aside className="hidden md:flex w-56 bg-gray-950 border-r border-gray-800 flex-col h-screen sticky top-0">
        <div className="px-4 py-5 border-b border-gray-800">
          <span className="text-white font-bold text-lg tracking-tight">
            Handwerk<span className="text-blue-500">OS</span>
          </span>
        </div>
        <NavLinks />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 h-12">
        <span className="text-white font-bold text-base tracking-tight">
          Handwerk<span className="text-blue-500">OS</span>
        </span>
        <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white p-1">
          <Menu size={22} />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)} />
      )}

      <div className={cn(
        'md:hidden fixed top-0 left-0 h-full w-64 z-50 bg-gray-950 border-r border-gray-800 flex flex-col transform transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between">
          <span className="text-white font-bold text-lg tracking-tight">
            Handwerk<span className="text-blue-500">OS</span>
          </span>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>
        <NavLinks onClick={() => setOpen(false)} />
      </div>
    </>
  )
}
