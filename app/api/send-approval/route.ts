import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { buildApprovalEmail } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { userEmail, title, artist, releaseDate, coverImage, format, genre } = await request.json()

    const data = await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [userEmail],
      subject: `🎉 "${title}" has been approved for distribution!`,
      html: buildApprovalEmail(artist, title, releaseDate || 'TBD', coverImage, format, genre),
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error sending approval email:', error)
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
