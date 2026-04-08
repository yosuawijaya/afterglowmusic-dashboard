import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { emailWrapper, detailsTable, ctaButton, messageBox, DASHBOARD_URL } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { releaseTitle, artist, userEmail, reason } = await request.json()

    // Email to artist
    const userContent = `
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;text-align:center;">
        <span style="color:#f87171;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">🗑 Release Deleted</span>
      </div>
      ${messageBox(
        `<strong style="color:rgba(255,255,255,0.9);">Hi ${artist},</strong><br/><br/>
        Your release <strong style="color:rgba(255,255,255,0.9);">"${releaseTitle}"</strong> has been successfully removed from our system. This action is permanent.`,
        '#f87171', 'rgba(239,68,68,0.07)', 'rgba(239,68,68,0.2)'
      )}
      ${detailsTable([
        { label: 'Release', value: releaseTitle },
        { label: 'Artist', value: artist },
        ...(reason ? [{ label: 'Reason', value: reason }] : []),
        { label: 'Status', value: '<span style="color:#f87171;font-weight:700;">Permanently Deleted</span>' },
      ])}
      <div style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.6);font-size:13px;line-height:1.6;margin:0;">
          If you believe this was done in error, please contact our support team immediately. You can submit a new release at any time from your dashboard.
        </p>
      </div>
      <div style="text-align:center;">
        ${ctaButton('Go to Dashboard →', `${DASHBOARD_URL}/dashboard`, '#6366f1')}
      </div>
    `

    await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [userEmail],
      subject: `Release deleted: "${releaseTitle}"`,
      html: emailWrapper(userContent),
    })

    // Email to admin
    const adminContent = `
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;text-align:center;">
        <span style="color:#f87171;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">🗑 Release Deleted by User</span>
      </div>
      ${detailsTable([
        { label: 'Release', value: releaseTitle },
        { label: 'Artist', value: artist },
        { label: 'Deleted by', value: userEmail },
        ...(reason ? [{ label: 'Reason', value: reason }] : []),
        { label: 'Timestamp', value: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
      ])}
    `

    await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [process.env.RECIPIENT_EMAIL || 'admin@afterglowmusic.com'],
      subject: `[Deleted] ${releaseTitle} — ${artist}`,
      html: emailWrapper(adminContent),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending delete notification:', error)
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
