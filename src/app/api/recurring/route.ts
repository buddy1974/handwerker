import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects, invoices, invoiceItems } from '@/lib/db/schema'
import { and, eq, lte, isNotNull, not, sql } from 'drizzle-orm'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const dueProjects = await db
    .select()
    .from(projects)
    .where(and(
      isNotNull(projects.recurringInterval),
      lte(projects.recurringNextDate, today),
      not(eq(projects.status, 'cancelled')),
      not(eq(projects.status, 'completed')),
    ))

  const results = []

  for (const project of dueProjects) {
    if (project.recurringEndDate && project.recurringEndDate < today) continue

    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.companyId, project.companyId))
      .then(r => Number(r[0]?.count ?? 0))

    const invoiceNumber = `RE-${String(existingCount + 1).padStart(4, '0')}`
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [newInvoice] = await db.insert(invoices).values({
      companyId: project.companyId,
      customerId: project.customerId,
      projectId: project.id,
      invoiceNumber,
      title: `Wartungsvertrag: ${project.title}`,
      status: 'draft',
      issueDate: today,
      dueDate,
      notes: 'Automatisch erstellt — bitte Betrag ausfüllen',
      createdBy: project.createdBy,
    }).returning()

    await db.insert(invoiceItems).values({
      invoiceId: newInvoice.id,
      title: `Wartungspauschale: ${project.title}`,
      description: 'Wartungspauschale für aktuelle Periode',
      quantity: '1',
      unitPrice: '0.00',
      taxRate: '19.00',
    })

    const next = new Date(project.recurringNextDate!)
    if (project.recurringInterval === 'monthly') next.setMonth(next.getMonth() + 1)
    else if (project.recurringInterval === 'quarterly') next.setMonth(next.getMonth() + 3)
    else next.setFullYear(next.getFullYear() + 1)

    await db.update(projects)
      .set({ recurringNextDate: next.toISOString().split('T')[0] })
      .where(eq(projects.id, project.id))

    results.push({ projectId: project.id, invoiceNumber })
  }

  return NextResponse.json({ processed: results.length, invoices: results })
}
