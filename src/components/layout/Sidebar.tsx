'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Clock,
  FileText,
  Receipt,
  FilePlus,
  Settings,
  Tablet,
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

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-56 bg-gray-950 border-r border-gray-800 flex flex-col h-screen sticky top-0">

      <div className="px-4 py-5 border-b border-gray-800">
        <span className="text-white font-bold text-lg tracking-tight">
          Handwerk<span className="text-blue-500">OS</span>
        </span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
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
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive(href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>

    </aside>
  )
}
