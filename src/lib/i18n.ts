export type Locale = 'de' | 'en'

export const translations = {
  de: {
    // Navigation
    dashboard: 'Dashboard',
    customers: 'Kunden',
    projects: 'Projekte',
    timeTracking: 'Zeiterfassung',
    reports: 'Berichte',
    offers: 'Angebote',
    invoices: 'Rechnungen',
    settings: 'Einstellungen',
    fieldMode: 'Feldmodus',

    // Common actions
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    back: 'Zurück',
    search: 'Suchen',
    filter: 'Filtern',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolgreich',

    // Customers
    newCustomer: 'Neuer Kunde',
    customerName: 'Kundenname',
    phone: 'Telefon',
    email: 'E-Mail',
    address: 'Adresse',
    street: 'Straße',
    city: 'Stadt',
    zip: 'PLZ',
    country: 'Land',
    state: 'Bundesland',

    // Projects
    newProject: 'Neues Projekt',
    projectTitle: 'Projekttitel',
    projectNumber: 'Projektnummer',
    status: 'Status',
    priority: 'Priorität',
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    description: 'Beschreibung',
    customer: 'Kunde',
    location: 'Einsatzort',

    // Status values
    draft: 'Entwurf',
    active: 'Aktiv',
    paused: 'Pausiert',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',

    // Priority values
    low: 'Niedrig',
    normal: 'Normal',
    high: 'Hoch',
    urgent: 'Dringend',

    // Offers & Invoices
    newOffer: 'Neues Angebot',
    newInvoice: 'Neue Rechnung',
    offerNumber: 'Angebotsnummer',
    invoiceNumber: 'Rechnungsnummer',
    issueDate: 'Ausstellungsdatum',
    dueDate: 'Fälligkeitsdatum',
    validUntil: 'Gültig bis',
    subtotal: 'Zwischensumme',
    tax: 'MwSt',
    total: 'Gesamt',
    paid: 'Bezahlt',
    unpaid: 'Offen',
    sent: 'Versendet',
    overdue: 'Überfällig',
    paymentTerms: 'Zahlungsbedingungen',
    paymentTermsDefault: '14 Tage netto',
    bankDetails: 'Bankverbindung',
    iban: 'IBAN',
    bic: 'BIC',
    bankName: 'Bankname',

    // Line items
    position: 'Pos.',
    itemTitle: 'Bezeichnung',
    quantity: 'Menge',
    unit: 'Einheit',
    unitPrice: 'Einzelpreis',
    lineTotal: 'Gesamt',
    addPosition: 'Position hinzufügen',

    // Reports
    newReport: 'Neuer Bericht',
    workDone: 'Durchgeführte Arbeiten',
    materialsUsed: 'Verwendete Materialien',
    nextSteps: 'Nächste Schritte',
    checklist: 'Checkliste',
    signature: 'Unterschrift',

    // Time tracking
    startTimer: 'Timer starten',
    stopTimer: 'Timer stoppen',
    duration: 'Dauer',
    notes: 'Notizen',

    // Settings
    companyName: 'Firmenname',
    vatNumber: 'USt-IdNr.',
    logo: 'Logo',
    brandColor: 'Markenfarbe',
    trade: 'Gewerk',
    locale: 'Sprache',
    language: 'Sprache',

    // PDF
    offer: 'ANGEBOT',
    invoice: 'RECHNUNG',
    deliveryDate: 'Lieferdatum',
    invoiceTo: 'Rechnungsempfänger',
    poweredBy: 'Erstellt mit HandwerkOS',

    // Warranty
    warrantyActive: 'Gewährleistung aktiv',
    warrantyExpired: 'Gewährleistung abgelaufen',
    warrantyStart: 'Beginn',
    warrantyEnd: 'Ende',
    daysRemaining: 'Tage verbleibend',

    // Recurring
    recurringMonthly: 'Monatlich',
    recurringQuarterly: 'Vierteljährlich',
    recurringYearly: 'Jährlich',
    nextInvoice: 'Nächste Rechnung',
  },

  en: {
    // Navigation
    dashboard: 'Dashboard',
    customers: 'Customers',
    projects: 'Projects',
    timeTracking: 'Time Tracking',
    reports: 'Reports',
    offers: 'Quotes',
    invoices: 'Invoices',
    settings: 'Settings',
    fieldMode: 'Field Mode',

    // Common actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    back: 'Back',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',

    // Customers
    newCustomer: 'New Customer',
    customerName: 'Customer Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    street: 'Street',
    city: 'City',
    zip: 'ZIP Code',
    country: 'Country',
    state: 'State',

    // Projects
    newProject: 'New Project',
    projectTitle: 'Project Title',
    projectNumber: 'Project Number',
    status: 'Status',
    priority: 'Priority',
    startDate: 'Start Date',
    endDate: 'End Date',
    description: 'Description',
    customer: 'Customer',
    location: 'Location',

    // Status values
    draft: 'Draft',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',

    // Priority values
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',

    // Offers & Invoices
    newOffer: 'New Quote',
    newInvoice: 'New Invoice',
    offerNumber: 'Quote Number',
    invoiceNumber: 'Invoice Number',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    validUntil: 'Valid Until',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    paid: 'Paid',
    unpaid: 'Unpaid',
    sent: 'Sent',
    overdue: 'Overdue',
    paymentTerms: 'Payment Terms',
    paymentTermsDefault: 'Net 14 days',
    bankDetails: 'Bank Details',
    iban: 'Account Number',
    bic: 'Routing Number',
    bankName: 'Bank Name',

    // Line items
    position: 'No.',
    itemTitle: 'Description',
    quantity: 'Qty',
    unit: 'Unit',
    unitPrice: 'Unit Price',
    lineTotal: 'Total',
    addPosition: 'Add Line Item',

    // Reports
    newReport: 'New Report',
    workDone: 'Work Completed',
    materialsUsed: 'Materials Used',
    nextSteps: 'Next Steps',
    checklist: 'Checklist',
    signature: 'Signature',

    // Time tracking
    startTimer: 'Start Timer',
    stopTimer: 'Stop Timer',
    duration: 'Duration',
    notes: 'Notes',

    // Settings
    companyName: 'Company Name',
    vatNumber: 'Tax ID / EIN',
    logo: 'Logo',
    brandColor: 'Brand Color',
    trade: 'Trade',
    locale: 'Language',
    language: 'Language',

    // PDF
    offer: 'QUOTE',
    invoice: 'INVOICE',
    deliveryDate: 'Delivery Date',
    invoiceTo: 'Bill To',
    poweredBy: 'Powered by HandwerkOS',

    // Warranty
    warrantyActive: 'Warranty Active',
    warrantyExpired: 'Warranty Expired',
    warrantyStart: 'Start',
    warrantyEnd: 'End',
    daysRemaining: 'days remaining',

    // Recurring
    recurringMonthly: 'Monthly',
    recurringQuarterly: 'Quarterly',
    recurringYearly: 'Yearly',
    nextInvoice: 'Next Invoice',
  },
} as const

export type TranslationKey = keyof typeof translations.de

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations.de[key] ?? key
}

export function getLocale(settings?: Record<string, string> | null): Locale {
  const l = settings?.locale
  return l === 'en' ? 'en' : 'de'
}
