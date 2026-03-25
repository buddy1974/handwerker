import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOfferEmail({
  to,
  companyName,
  offerNumber,
  total,
  pdfBuffer,
  fileName,
}: {
  to: string
  companyName: string
  offerNumber: string
  total: string
  pdfBuffer: Buffer
  fileName: string
}) {
  return resend.emails.send({
    from: `HandwerkOS <noreply@maxpromo.digital>`,
    to: [to],
    subject: `Angebot ${offerNumber} von ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Ihr Angebot von ${companyName}</h2>
        <p>Sehr geehrte Damen und Herren,</p>
        <p>anbei erhalten Sie unser Angebot <strong>${offerNumber}</strong> über <strong>${total}</strong>.</p>
        <p>Das Angebot finden Sie im Anhang als PDF.</p>
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
        <br/>
        <p>Mit freundlichen Grüßen<br/>${companyName}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"/>
        <p style="font-size: 11px; color: #9ca3af;">Powered by <a href="https://maxpromo.digital" style="color: #9ca3af;">maxpromo.digital</a></p>
      </div>
    `,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
      },
    ],
  })
}

export async function sendInvoiceEmail({
  to,
  companyName,
  invoiceNumber,
  total,
  dueDate,
  pdfBuffer,
  fileName,
}: {
  to: string
  companyName: string
  invoiceNumber: string
  total: string
  dueDate?: string | null
  pdfBuffer: Buffer
  fileName: string
}) {
  return resend.emails.send({
    from: `HandwerkOS <noreply@maxpromo.digital>`,
    to: [to],
    subject: `Rechnung ${invoiceNumber} von ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Ihre Rechnung von ${companyName}</h2>
        <p>Sehr geehrte Damen und Herren,</p>
        <p>anbei erhalten Sie unsere Rechnung <strong>${invoiceNumber}</strong> über <strong>${total}</strong>.</p>
        ${dueDate ? `<p>Bitte überweisen Sie den Betrag bis zum <strong>${dueDate}</strong>.</p>` : ''}
        <p>Die Rechnung finden Sie im Anhang als PDF.</p>
        <br/>
        <p>Mit freundlichen Grüßen<br/>${companyName}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"/>
        <p style="font-size: 11px; color: #9ca3af;">Powered by <a href="https://maxpromo.digital" style="color: #9ca3af;">maxpromo.digital</a></p>
      </div>
    `,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
      },
    ],
  })
}
