import { z } from 'zod'

export const invoiceItemSchema = z.object({
  position: z.number().int().default(1),
  title: z.string().min(1, 'Titel erforderlich'),
  description: z.string().optional(),
  quantity: z.string().default('1'),
  unit: z.string().default('Stk'),
  unitPrice: z.string().default('0'),
  discountPct: z.string().default('0'),
  taxRate: z.string().default('19.00'),
  sortOrder: z.number().int().default(0),
})

export const createInvoiceSchema = z.object({
  projectId: z.string().uuid().optional(),
  customerId: z.string().uuid('Kunde erforderlich'),
  offerId: z.string().uuid().optional(),
  title: z.string().min(1, 'Titel erforderlich'),
  issueDate: z.string().default(() => new Date().toISOString().split('T')[0]),
  dueDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  introText: z.string().optional(),
  outroText: z.string().optional(),
  paymentTerms: z.string().default('14 Tage netto'),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  currency: z.string().default('EUR'),
  notes: z.string().optional(),
  depositAmount: z.string().optional().default('0'),
  depositDate: z.string().optional().nullable(),
  depositMethod: z.string().optional().nullable(),
  depositNote: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).default([]),
})

export const updateInvoiceSchema = createInvoiceSchema.partial()
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type InvoiceItem = z.infer<typeof invoiceItemSchema>
