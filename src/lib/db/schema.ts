import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  date,
  timestamp,
  jsonb,
  inet,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── ENUMS ───────────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', ['admin', 'office', 'manager', 'worker'])
export const projectStatusEnum = pgEnum('project_status', ['draft', 'active', 'paused', 'completed', 'cancelled'])
export const reportStatusEnum = pgEnum('report_status', ['draft', 'submitted', 'approved'])
export const offerStatusEnum = pgEnum('offer_status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled'])
export const timeEntryStatusEnum = pgEnum('time_entry_status', ['running', 'stopped', 'approved'])
export const documentTypeEnum = pgEnum('document_type', ['offer', 'invoice', 'report', 'other'])

// ─── COMPANIES ───────────────────────────────────────────────
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  email: text('email'),
  phone: text('phone'),
  addressStreet: text('address_street'),
  addressCity: text('address_city'),
  addressZip: text('address_zip'),
  addressCountry: text('address_country').default('DE'),
  vatNumber: text('vat_number'),
  logoUrl: text('logo_url'),
  brandColor: text('brand_color').default('#1a56db'),
  invoicePrefix: text('invoice_prefix').default('RE'),
  offerPrefix: text('offer_prefix').default('AN'),
  nextInvoiceNr: integer('next_invoice_nr').default(1000),
  nextOfferNr: integer('next_offer_nr').default(1000),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── USERS ───────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role').notNull().default('worker'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  passwordHash: text('password_hash'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_users_company').on(t.companyId),
])

// ─── CUSTOMERS ───────────────────────────────────────────────
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').default('business'),
  contactName: text('contact_name'),
  email: text('email'),
  phone: text('phone'),
  addressStreet: text('address_street'),
  addressCity: text('address_city'),
  addressZip: text('address_zip'),
  addressCountry: text('address_country').default('DE'),
  vatNumber: text('vat_number'),
  notes: text('notes'),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_customers_company').on(t.companyId),
])

// ─── PROJECTS ────────────────────────────────────────────────
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  projectNumber: text('project_number'),
  title: text('title').notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('draft'),
  priority: integer('priority').default(2),
  locationName: text('location_name'),
  locationStreet: text('location_street'),
  locationCity: text('location_city'),
  locationZip: text('location_zip'),
  locationLat: numeric('location_lat', { precision: 10, scale: 7 }),
  locationLng: numeric('location_lng', { precision: 10, scale: 7 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  estimatedHours: numeric('estimated_hours', { precision: 8, scale: 2 }),
  notes: text('notes'),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  metadata: jsonb('metadata').default({}),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_projects_company').on(t.companyId),
  index('idx_projects_customer').on(t.customerId),
  index('idx_projects_status').on(t.status),
])

// ─── PROJECT ASSIGNMENTS ─────────────────────────────────────
export const projectAssignments = pgTable('project_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').default('worker'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow(),
  assignedBy: uuid('assigned_by').references(() => users.id),
}, (t) => [
  index('idx_assignments_project').on(t.projectId),
  index('idx_assignments_user').on(t.userId),
  uniqueIndex('uniq_assignment').on(t.projectId, t.userId),
])

// ─── TIME ENTRIES ────────────────────────────────────────────
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  taskLabel: text('task_label'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  stoppedAt: timestamp('stopped_at', { withTimezone: true }),
  durationMin: integer('duration_min'),
  status: timeEntryStatusEnum('status').default('running'),
  notes: text('notes'),
  isBillable: boolean('is_billable').default(true),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_time_company').on(t.companyId),
  index('idx_time_project').on(t.projectId),
  index('idx_time_user').on(t.userId),
])

// ─── PHOTOS ──────────────────────────────────────────────────
export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  reportId: uuid('report_id'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  storagePath: text('storage_path').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type').default('image/jpeg'),
  width: integer('width'),
  height: integer('height'),
  caption: text('caption'),
  takenAt: timestamp('taken_at', { withTimezone: true }),
  locationLat: numeric('location_lat', { precision: 10, scale: 7 }),
  locationLng: numeric('location_lng', { precision: 10, scale: 7 }),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_photos_project').on(t.projectId),
  index('idx_photos_report').on(t.reportId),
])

// ─── MEASUREMENTS / AUFMASS ──────────────────────────────────
export const measurements = pgTable('measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  photoId: uuid('photo_id').references(() => photos.id),
  title: text('title'),
  originalPhotoPath: text('original_photo_path'),
  annotatedPhotoPath: text('annotated_photo_path'),
  annotations: jsonb('annotations').default([]),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_measurements_project').on(t.projectId),
])

// ─── SERVICE REPORTS ─────────────────────────────────────────
export const serviceReports = pgTable('service_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  reportNumber: text('report_number'),
  title: text('title').notNull(),
  status: reportStatusEnum('status').default('draft'),
  workDate: date('work_date').notNull(),
  workerId: uuid('worker_id').references(() => users.id),
  description: text('description'),
  workDone: text('work_done'),
  materialsUsed: text('materials_used'),
  nextSteps: text('next_steps'),
  customerPresent: boolean('customer_present').default(false),
  customerName: text('customer_name'),
  signaturePath: text('signature_path'),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  pdfPath: text('pdf_path'),
  pdfGeneratedAt: timestamp('pdf_generated_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_reports_company').on(t.companyId),
  index('idx_reports_project').on(t.projectId),
])

// ─── REPORT CHECKLIST ITEMS ──────────────────────────────────
export const reportChecklistItems = pgTable('report_checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => serviceReports.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  isChecked: boolean('is_checked').default(false),
  sortOrder: integer('sort_order').default(0),
  notes: text('notes'),
})

// ─── CHECKLIST TEMPLATES ─────────────────────────────────────
export const checklistTemplates = pgTable('checklist_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  items: jsonb('items').default([]),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ─── MATERIALS CATALOG ───────────────────────────────────────
export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit').default('Stk'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull().default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('19.00'),
  sku: text('sku'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_materials_company').on(t.companyId),
])

// ─── OFFERS ──────────────────────────────────────────────────
export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  offerNumber: text('offer_number').unique(),
  title: text('title').notNull(),
  status: offerStatusEnum('status').default('draft'),
  issueDate: date('issue_date'),
  validUntil: date('valid_until'),
  introText: text('intro_text'),
  outroText: text('outro_text'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0'),
  discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).default('0'),
  currency: text('currency').default('EUR'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  pdfPath: text('pdf_path'),
  pdfGeneratedAt: timestamp('pdf_generated_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_offers_company').on(t.companyId),
  index('idx_offers_project').on(t.projectId),
  index('idx_offers_customer').on(t.customerId),
])

// ─── OFFER ITEMS ─────────────────────────────────────────────
export const offerItems = pgTable('offer_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: uuid('offer_id').notNull().references(() => offers.id, { onDelete: 'cascade' }),
  materialId: uuid('material_id').references(() => materials.id),
  position: integer('position').notNull().default(1),
  title: text('title').notNull(),
  description: text('description'),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull().default('1'),
  unit: text('unit').default('Stk'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull().default('0'),
  discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('19.00'),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).default('0'),
  isOptional: boolean('is_optional').default(false),
  sortOrder: integer('sort_order').default(0),
}, (t) => [
  index('idx_offer_items_offer').on(t.offerId),
])

// ─── INVOICES ────────────────────────────────────────────────
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  offerId: uuid('offer_id').references(() => offers.id),
  invoiceNumber: text('invoice_number').unique(),
  title: text('title').notNull(),
  status: invoiceStatusEnum('status').default('draft'),
  issueDate: date('issue_date'),
  dueDate: date('due_date'),
  deliveryDate: date('delivery_date'),
  introText: text('intro_text'),
  outroText: text('outro_text'),
  paymentTerms: text('payment_terms').default('14 Tage netto'),
  bankName: text('bank_name'),
  iban: text('iban'),
  bic: text('bic'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0'),
  discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).default('0'),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).default('0'),
  currency: text('currency').default('EUR'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  pdfPath: text('pdf_path'),
  pdfGeneratedAt: timestamp('pdf_generated_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_invoices_company').on(t.companyId),
  index('idx_invoices_project').on(t.projectId),
  index('idx_invoices_customer').on(t.customerId),
])

// ─── INVOICE ITEMS ───────────────────────────────────────────
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  materialId: uuid('material_id').references(() => materials.id),
  timeEntryId: uuid('time_entry_id').references(() => timeEntries.id),
  position: integer('position').notNull().default(1),
  title: text('title').notNull(),
  description: text('description'),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull().default('1'),
  unit: text('unit').default('Stk'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull().default('0'),
  discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('19.00'),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).default('0'),
  sortOrder: integer('sort_order').default(0),
}, (t) => [
  index('idx_invoice_items_invoice').on(t.invoiceId),
])

// ─── DOCUMENTS ───────────────────────────────────────────────
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id),
  reportId: uuid('report_id').references(() => serviceReports.id),
  offerId: uuid('offer_id').references(() => offers.id),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  type: documentTypeEnum('type').default('other'),
  name: text('name').notNull(),
  storagePath: text('storage_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_documents_project').on(t.projectId),
])

// ─── NOTIFICATIONS ───────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  data: jsonb('data').default({}),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_notifications_user').on(t.userId, t.isRead),
])

// ─── AUDIT LOGS ──────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_audit_company').on(t.companyId),
  index('idx_audit_entity').on(t.entityType, t.entityId),
])

// ─── TYPES (inferred from schema) ────────────────────────────
export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type TimeEntry = typeof timeEntries.$inferSelect
export type NewTimeEntry = typeof timeEntries.$inferInsert
export type Photo = typeof photos.$inferSelect
export type Measurement = typeof measurements.$inferSelect
export type ServiceReport = typeof serviceReports.$inferSelect
export type NewServiceReport = typeof serviceReports.$inferInsert
export type Material = typeof materials.$inferSelect
export type Offer = typeof offers.$inferSelect
export type NewOffer = typeof offers.$inferInsert
export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect
