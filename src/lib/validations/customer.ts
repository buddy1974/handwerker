import { z } from 'zod'

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  type: z.enum(['business', 'private']).default('business'),
  contactName: z.string().max(100).optional(),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  addressStreet: z.string().max(100).optional(),
  addressCity: z.string().max(100).optional(),
  addressZip: z.string().max(20).optional(),
  addressState: z.string().max(50).optional(),
  addressCountry: z.string().max(2).default('DE'),
  vatNumber: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
})

export const updateCustomerSchema = createCustomerSchema.partial()

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
