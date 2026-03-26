import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import UserMenu from '@/components/layout/UserMenu'
import Footer from '@/components/layout/Footer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 border-b border-gray-800 flex items-center justify-end px-4 flex-shrink-0 mt-12 md:mt-0">
          <UserMenu
            firstName={session.user.firstName}
            lastName={session.user.lastName}
            role={session.user.role}
          />
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
