import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer'
import type { PDFCompany, PDFCustomer, PDFItem } from './OfferPDF'
import { formatCurrency, taxLabel } from '@/lib/utils/money'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  companyBlock: { flex: 1 },
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  companyDetail: { fontSize: 8, color: '#666', marginBottom: 1 },
  docBlock: { alignItems: 'flex-end' },
  docTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  docNumber: { fontSize: 9, color: '#666', marginBottom: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 20 },
  metaRow: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 7, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 9, color: '#111827' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  customerName: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  customerDetail: { fontSize: 9, color: '#374151', marginBottom: 1 },
  table: { marginBottom: 0 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 3, marginBottom: 2 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableHeaderText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  colPos: { width: '5%' },
  colDesc: { flex: 1 },
  colQty: { width: '10%', textAlign: 'right' },
  colUnit: { width: '8%', textAlign: 'center' },
  colPrice: { width: '12%', textAlign: 'right' },
  colTax: { width: '8%', textAlign: 'center' },
  colTotal: { width: '13%', textAlign: 'right' },
  cellText: { fontSize: 8, color: '#111827' },
  cellSub: { fontSize: 7, color: '#9ca3af', marginTop: 1 },
  totalsBlock: { marginTop: 12, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginBottom: 3, minWidth: 200 },
  totalsLabel: { fontSize: 8, color: '#6b7280', width: 80, textAlign: 'right' },
  totalsValue: { fontSize: 8, color: '#111827', width: 70, textAlign: 'right' },
  totalsFinalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111827', width: 80, textAlign: 'right' },
  totalsFinalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', width: 70, textAlign: 'right' },
  bankBlock: { marginTop: 20, padding: 10, backgroundColor: '#f9fafb', borderRadius: 4 },
  bankTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  bankRow: { flexDirection: 'row', gap: 24, marginBottom: 2 },
  bankLabel: { fontSize: 7, color: '#9ca3af', width: 40 },
  bankValue: { fontSize: 7, color: '#111827' },
  paymentNote: { marginTop: 12, padding: 8, backgroundColor: '#eff6ff', borderRadius: 4, borderLeftWidth: 3, borderLeftColor: '#1a56db' },
  paymentText: { fontSize: 8, color: '#1e40af' },
  footer: { position: 'absolute', bottom: 20, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  footerText: { fontSize: 7, color: '#9ca3af' },
  footerBrand: { fontSize: 6, color: '#d1d5db' },
})


export type PDFInvoice = {
  invoiceNumber: string | null
  title: string
  issueDate: string | null
  dueDate?: string | null
  deliveryDate?: string | null
  paymentTerms?: string | null
  introText?: string | null
  outroText?: string | null
  subtotal: string | null
  taxAmount: string | null
  total: string | null
  iban?: string | null
  bic?: string | null
  bankName?: string | null
  locale?: 'de' | 'en'
}

export function InvoicePDF({
  company,
  customer,
  invoice,
  items,
}: {
  company: PDFCompany
  customer: PDFCustomer
  invoice: PDFInvoice
  items: PDFItem[]
}) {
  const brandColor = company.brandColor || '#1a56db'
  const iban = invoice.iban || company.iban
  const bic = invoice.bic || company.bic
  const bankName = invoice.bankName || company.bankName
  const loc = invoice.locale ?? 'de'
  const fmt = (val: number | string) => formatCurrency(Number(val), loc)
  const fmtDate = (d: string | null | undefined) => d
    ? (loc === 'en' ? new Date(d).toLocaleDateString('en-US') : new Date(d).toLocaleDateString('de-DE'))
    : ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          <View style={styles.companyBlock}>
            {company.logoUrl && (
              <Image src={company.logoUrl} style={{ width: 80, height: 40, objectFit: 'contain', marginBottom: 6 }} />
            )}
            <Text style={styles.companyName}>{company.name}</Text>
            {company.addressStreet && <Text style={styles.companyDetail}>{company.addressStreet}</Text>}
            {(company.addressZip || company.addressCity) && (
              <Text style={styles.companyDetail}>{[company.addressZip, company.addressCity].filter(Boolean).join(' ')}</Text>
            )}
            {company.phone && <Text style={styles.companyDetail}>Tel: {company.phone}</Text>}
            {company.email && <Text style={styles.companyDetail}>{company.email}</Text>}
            {company.vatNumber && <Text style={styles.companyDetail}>USt-IdNr: {company.vatNumber}</Text>}
          </View>
          <View style={styles.docBlock}>
            <Text style={[styles.docTitle, { color: brandColor }]}>{loc === 'en' ? 'INVOICE' : 'RECHNUNG'}</Text>
            <Text style={styles.docNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{loc === 'en' ? 'Issue Date' : 'Rechnungsdatum'}</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.issueDate)}</Text>
          </View>
          {invoice.dueDate && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{loc === 'en' ? 'Due Date' : 'Fällig am'}</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
            </View>
          )}
          {invoice.deliveryDate && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{loc === 'en' ? 'Delivery Date' : 'Leistungsdatum'}</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.deliveryDate)}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{loc === 'en' ? 'Invoice No.' : 'Rechnungs-Nr.'}</Text>
            <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{loc === 'en' ? 'Bill To' : 'Rechnungsempfänger'}</Text>
          <Text style={styles.customerName}>{customer.name}</Text>
          {customer.addressStreet && <Text style={styles.customerDetail}>{customer.addressStreet}</Text>}
          {(customer.addressZip || customer.addressCity) && (
            <Text style={styles.customerDetail}>{[customer.addressZip, customer.addressCity].filter(Boolean).join(' ')}</Text>
          )}
          {customer.email && <Text style={styles.customerDetail}>{customer.email}</Text>}
        </View>

        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 12 }}>
          Betreff: {invoice.title}
        </Text>

        {invoice.introText && (
          <Text style={{ fontSize: 9, color: '#374151', lineHeight: 1.5, marginBottom: 16 }}>
            {invoice.introText}
          </Text>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colPos]}>{loc === 'en' ? 'No.' : 'Pos'}</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>{loc === 'en' ? 'Description' : 'Bezeichnung'}</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>{loc === 'en' ? 'Qty' : 'Menge'}</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>{loc === 'en' ? 'Unit' : 'Einh.'}</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>{loc === 'en' ? 'Unit Price' : 'Preis'}</Text>
            <Text style={[styles.tableHeaderText, styles.colTax]}>{taxLabel(loc)}</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>{loc === 'en' ? 'Total' : 'Gesamt'}</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colPos]}>{item.position}</Text>
              <View style={styles.colDesc}>
                <Text style={styles.cellText}>{item.title}</Text>
                {item.description && <Text style={styles.cellSub}>{item.description}</Text>}
              </View>
              <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.cellText, styles.colUnit]}>{item.unit}</Text>
              <Text style={[styles.cellText, styles.colPrice]}>{fmt(item.unitPrice ?? 0)}</Text>
              <Text style={[styles.cellText, styles.colTax]}>{item.taxRate}%</Text>
              <Text style={[styles.cellText, styles.colTotal]}>{fmt(item.lineTotal ?? 0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{loc === 'en' ? 'Subtotal' : 'Nettobetrag'}</Text>
            <Text style={styles.totalsValue}>{fmt(invoice.subtotal ?? 0)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{taxLabel(loc)}</Text>
            <Text style={styles.totalsValue}>{fmt(invoice.taxAmount ?? 0)}</Text>
          </View>
          <View style={[styles.totalsRow, { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 4, marginTop: 4 }]}>
            <Text style={styles.totalsFinalLabel}>{loc === 'en' ? 'Total' : 'Gesamtbetrag'}</Text>
            <Text style={[styles.totalsFinalValue, { color: brandColor }]}>{fmt(invoice.total ?? 0)}</Text>
          </View>
        </View>

        {invoice.paymentTerms && (
          <View style={styles.paymentNote}>
            <Text style={styles.paymentText}>{loc === 'en' ? 'Payment Terms:' : 'Zahlungsbedingung:'} {invoice.paymentTerms}</Text>
          </View>
        )}

        {(iban || bankName) && (
          <View style={styles.bankBlock}>
            <Text style={styles.bankTitle}>{loc === 'en' ? 'Bank Details' : 'Bankverbindung'}</Text>
            {bankName && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Bank</Text>
                <Text style={styles.bankValue}>{bankName}</Text>
              </View>
            )}
            {iban && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{loc === 'en' ? 'Account' : 'IBAN'}</Text>
                <Text style={styles.bankValue}>{iban}</Text>
              </View>
            )}
            {bic && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{loc === 'en' ? 'Routing' : 'BIC'}</Text>
                <Text style={styles.bankValue}>{bic}</Text>
              </View>
            )}
          </View>
        )}

        {invoice.outroText && (
          <Text style={{ fontSize: 9, color: '#374151', lineHeight: 1.5, marginTop: 16 }}>
            {invoice.outroText}
          </Text>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{company.name} · {[company.addressStreet, company.addressZip, company.addressCity].filter(Boolean).join(', ')}</Text>
          <Text style={styles.footerBrand}>powered by maxpromo.digital</Text>
        </View>

      </Page>
    </Document>
  )
}
