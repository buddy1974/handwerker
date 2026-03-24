import { z } from 'zod'

export const createMeasurementSchema = z.object({
  projectId: z.string().uuid(),
  photoId: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  originalPhotoPath: z.string().optional(),
  annotatedPhotoPath: z.string().optional(),
  annotations: z.array(z.object({
    type: z.enum(['line', 'rect', 'text']),
    points: z.array(z.number()),
    label: z.string(),
    unit: z.string().default('m'),
    color: z.string().default('#ff0000'),
  })).default([]),
  notes: z.string().max(1000).optional(),
})

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>
export type Annotation = z.infer<typeof createMeasurementSchema>['annotations'][0]
