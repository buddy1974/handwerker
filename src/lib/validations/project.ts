import { z } from 'zod'

export const createProjectSchema = z.object({
  customerId: z.string().uuid('Ungültige Kunden-ID'),
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
  priority: z.coerce.number().int().min(1).max(3).default(2),
  locationName: z.string().max(200).optional(),
  locationStreet: z.string().max(100).optional(),
  locationCity: z.string().max(100).optional(),
  locationZip: z.string().max(20).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  recurringInterval: z.enum(['monthly', 'quarterly', 'yearly']).optional().nullable(),
  recurringNextDate: z.string().optional().nullable(),
  recurringEndDate: z.string().optional().nullable(),
  estimatedHours: z.string().optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
