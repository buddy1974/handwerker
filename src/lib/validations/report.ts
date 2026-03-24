import { z } from 'zod'

export const createReportSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, 'Titel erforderlich').max(200),
  workDate: z.string(),
  description: z.string().max(2000).optional(),
  workDone: z.string().max(2000).optional(),
  materialsUsed: z.string().max(1000).optional(),
  nextSteps: z.string().max(1000).optional(),
  customerPresent: z.boolean().default(false),
  customerName: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  checklistItems: z.array(z.object({
    label: z.string(),
    isChecked: z.boolean(),
    notes: z.string().optional(),
  })).default([]),
})

export const updateReportSchema = createReportSchema.partial()
export type CreateReportInput = z.infer<typeof createReportSchema>
export type UpdateReportInput = z.infer<typeof updateReportSchema>
