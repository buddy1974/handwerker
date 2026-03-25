import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, users, customers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import PlantafelBoard from '@/components/project/PlantafelBoard'

export default async function PlantafelPage() {
  const session = await auth()

  const allProjects = await db
    .select({
      id: projects.id,
      title: projects.title,
      projectNumber: projects.projectNumber,
      status: projects.status,
      startDate: projects.startDate,
      endDate: projects.endDate,
      locationCity: projects.locationCity,
      customer: { name: customers.name },
    })
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id))
    .where(eq(projects.companyId, session!.user.companyId))
    .orderBy(desc(projects.createdAt))

  const allWorkers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    })
    .from(users)
    .where(eq(users.companyId, session!.user.companyId))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Plantafel</h1>
        <p className="text-gray-400 text-sm mt-1">Projekte und Mitarbeiter planen</p>
      </div>
      <PlantafelBoard
        projects={allProjects}
        workers={allWorkers}
      />
    </div>
  )
}
