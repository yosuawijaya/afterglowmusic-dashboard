import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { emailWrapper, detailsTable, ctaButton, messageBox, DASHBOARD_URL } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { releaseTitle, artist, userEmail, changes } = await request.json()

    // Email to artist
    const userContent = `
      <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;text-align:center;">
        <span style="color:#a5b4fc;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">↑ Release Updated</span>
      </div>
      ${messageBox(
        `<strong style="color:rgba(255,255,255,0.9);">Hi ${artist},</strong><br/><br/>
        Your release has been successfully updated. Our team will review the changes and you'll receive a notification once the review is complete.`,
        '#818cf8', 'rgba(99,102,241,0.07)', 'rgba(99,102,241,0.2)'
      )}
      ${detailsTable([
        { label: 'Release', value: releaseTitle },
        { label: 'Artist', value: artist },
        { label: 'Status', value: '<span style="color:#f59e0b;font-weight:700;">⏳ Under Review</span>' },
      ])}
      ${changes?.length > 0 ? `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <div style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Changes Made</div>
          ${changes.map((c: string) => `<div style="color:rgba(255,255,255,0.65);font-size:13px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);">• ${c}</div>`).join('')}
        </div>
      ` : ''}
      <div style="text-align:center;">
        ${ctaButton('View Your Release →', `${DASHBOARD_URL}/dashboard`)}
      </div>
    `

    await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [userEmail],
      subject: `✓ Release updated: "${releaseTitle}"`,
      html: emailWrapper(userContent),
    })

    // Email to admin
    const adminContent = `
      <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;text-align:center;">
        <span style="color:#f59e0b;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">⚠️ Release Edited — Review Required</span>
      </div>
      ${detailsTable([
        { label: 'Release', value: releaseTitle },
        { label: 'Artist', value: artist },
        { label: 'Submitted by', value: userEmail },
        { label: 'Action', value: '<span style="color:#f59e0b;font-weight:700;">Review required</span>' },
      ])}
      ${changes?.length > 0 ? `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <div style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Changes</div>
          ${changes.map((c: string) => `<div style="color:rgba(255,255,255,0.65);font-size:13px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);">• ${c}</div>`).join('')}
        </div>
      ` : ''}
      <div style="text-align:center;">
        ${ctaButton('Review in Admin Panel →', `${DASHBOARD_URL}/admin`)}
      </div>
    `

    await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [process.env.RECIPIENT_EMAIL || 'admin@afterglowmusic.com'],
      subject: `[Edit] ${releaseTitle} — ${artist}`,
      html: emailWrapper(adminContent),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending edit notification:', error)
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
