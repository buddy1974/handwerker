import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <span className="text-white font-bold">HandwerkOS</span>
        <span className="text-gray-400 text-sm">
          {session.user.firstName} {session.user.lastName}
        </span>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
