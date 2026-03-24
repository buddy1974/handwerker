import { z } from 'zod'

export const createTimeEntrySchema = z.object({
  projectId: z.string().uuid('Ungültige Projekt-ID'),
  taskLabel: z.string().max(200).optional(),
  startedAt: z.string().datetime(),
  stoppedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  isBillable: z.boolean().default(true),
})

export const stopTimeEntrySchema = z.object({
  stoppedAt: z.string().datetime(),
})

export const updateTimeEntrySchema = z.object({
  taskLabel: z.string().max(200).optional(),
  startedAt: z.string().datetime().optional(),
  stoppedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  isBillable: z.boolean().optional(),
})

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>
export type StopTimeEntryInput = z.infer<typeof stopTimeEntrySchema>
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>
