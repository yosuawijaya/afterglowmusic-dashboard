import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { buildRejectionEmail } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { userEmail, title, artist, reason, coverImage } = await request.json()

    const data = await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [userEmail],
      subject: `Action Required: "${title}" needs revision`,
      html: buildRejectionEmail(artist, title, reason || 'Please check your release details and resubmit.', coverImage),
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error sending rejection email:', error)
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
