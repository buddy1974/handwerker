import { z } from 'zod'

export const offerItemSchema = z.object({
  position: z.number().int().default(1),
  title: z.string().min(1, 'Titel erforderlich'),
  description: z.string().optional(),
  quantity: z.string().default('1'),
  unit: z.string().default('Stk'),
  unitPrice: z.string().default('0'),
  discountPct: z.string().default('0'),
  taxRate: z.string().default('19.00'),
  isOptional: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})

export const createOfferSchema = z.object({
  projectId: z.string().uuid().optional(),
  customerId: z.string().uuid('Kunde erforderlich'),
  title: z.string().min(1, 'Titel erforderlich'),
  issueDate: z.string().default(() => new Date().toISOString().split('T')[0]),
  validUntil: z.string().optional(),
  introText: z.string().optional(),
  outroText: z.string().optional(),
  currency: z.string().default('EUR'),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(offerItemSchema).default([]),
})

export const updateOfferSchema = createOfferSchema.partial()
export type CreateOfferInput = z.infer<typeof createOfferSchema>
export type OfferItem = z.infer<typeof offerItemSchema>
