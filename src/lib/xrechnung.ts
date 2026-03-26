export type XRechnungData = {
  invoiceNumber: string
  issueDate: string        // YYYY-MM-DD
  dueDate: string          // YYYY-MM-DD
  deliveryDate?: string    // YYYY-MM-DD
  seller: {
    name: string
    street: string
    city: string
    zip: string
    country?: string
    vatId?: string
    iban?: string
    bic?: string
    bankName?: string
    email?: string
  }
  buyer: {
    name: string
    street?: string
    city?: string
    zip?: string
    country?: string
    email?: string
  }
  items: {
    title: string
    description?: string
    quantity: number
    unit: string
    unitPrice: number
    taxRate: number
    lineTotal: number
  }[]
  subtotal: number
  taxAmount: number
  total: number
  notes?: string
  paymentTerms?: string
}

export function generateXRechnung(data: XRechnungData): string {
  const formatDate = (d: string) => d.replace(/-/g, '')
  const formatAmount = (n: number) => n.toFixed(2)
  const country = (c?: string) => c ?? 'DE'

  const itemsXml = data.items.map((item, i) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(item.title)}</ram:Name>
        ${item.description ? `<ram:Description>${escapeXml(item.description)}</ram:Description>` : ''}
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatAmount(item.unitPrice)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${item.unit || 'C62'}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${item.taxRate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatAmount(item.lineTotal)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_2.3</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(data.invoiceNumber)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDate(data.issueDate)}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${data.notes ? `<ram:IncludedNote><ram:Content>${escapeXml(data.notes)}</ram:Content></ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>

    ${itemsXml}

    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(data.seller.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(data.seller.street ?? '')}</ram:LineOne>
          <ram:CityName>${escapeXml(data.seller.city ?? '')}</ram:CityName>
          <ram:PostcodeCode>${escapeXml(data.seller.zip ?? '')}</ram:PostcodeCode>
          <ram:CountryID>${country(data.seller.country)}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.seller.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${escapeXml(data.seller.email)}</ram:URIID></ram:URIUniversalCommunication>` : ''}
        ${data.seller.vatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(data.seller.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>

      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(data.buyer.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(data.buyer.street ?? '')}</ram:LineOne>
          <ram:CityName>${escapeXml(data.buyer.city ?? '')}</ram:CityName>
          <ram:PostcodeCode>${escapeXml(data.buyer.zip ?? '')}</ram:PostcodeCode>
          <ram:CountryID>${country(data.buyer.country)}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.buyer.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${escapeXml(data.buyer.email)}</ram:URIID></ram:URIUniversalCommunication>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${formatDate(data.deliveryDate ?? data.issueDate)}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${escapeXml(data.invoiceNumber)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      ${data.seller.iban ? `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${escapeXml(data.seller.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        ${data.seller.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${escapeXml(data.seller.bic)}</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>` : ''}
      </ram:SpecifiedTradeSettlementPaymentMeans>` : ''}
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${formatAmount(data.taxAmount)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${formatAmount(data.subtotal)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>19</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      ${data.paymentTerms ? `<ram:SpecifiedTradePaymentTerms><ram:Description>${escapeXml(data.paymentTerms)}</ram:Description></ram:SpecifiedTradePaymentTerms>` : ''}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${formatAmount(data.subtotal)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${formatAmount(data.subtotal)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${formatAmount(data.taxAmount)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${formatAmount(data.total)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${formatAmount(data.total)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
