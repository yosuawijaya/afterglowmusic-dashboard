import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { buildApprovalEmail } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const data = await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: ['yosuaawijayaaa@gmail.com'],
      subject: '🎉 "Saldo Akhirat" has been approved for distribution!',
      html: buildApprovalEmail('Zahwa Kareema', 'Saldo Akhirat', 'March 29, 2026', undefined, 'Single', 'Pop'),
    })

    return NextResponse.json({ success: true, message: 'Test email sent to yosuaawijayaaa@gmail.com', data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
