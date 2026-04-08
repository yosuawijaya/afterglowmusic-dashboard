import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { emailWrapper, releaseCard, detailsTable, ctaButton, statusBadge, messageBox, greeting, DASHBOARD_URL } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, artist, featuringArtists, genre, format, releaseDate, territories, tracks, coverImage, userEmail } = body
    const artistDisplay = featuringArtists ? `${artist} feat. ${featuringArtists}` : artist

    // Email to artist — submission confirmation
    const userContent =
      greeting(artist) +
      statusBadge('Submission Received', '#f59e0b', 'rgba(245,158,11,0.1)', 'rgba(245,158,11,0.3)') +
      releaseCard(title, artistDisplay, coverImage, format, genre) +
      messageBox(
        `We've successfully received your release submission. Our team will review your content and you'll receive an update within <strong>2–3 business days</strong>.`,
        'rgba(245,158,11,0.07)', 'rgba(245,158,11,0.2)'
      ) +
      detailsTable([
        { label: 'Release Date', value: releaseDate || 'TBD' },
        { label: 'Format', value: format || '—' },
        { label: 'Genre', value: genre || '—' },
        { label: 'Tracks', value: `${tracks?.length || 0} track${(tracks?.length || 0) !== 1 ? 's' : ''}` },
        { label: 'Distribution', value: territories === 'worldwide' ? 'Worldwide · 240 territories' : 'Selected territories' },
        { label: 'Review SLA', value: 'Within 2–3 business days' },
      ]) +
      ctaButton('Track Your Submission', `${DASHBOARD_URL}/dashboard`, '#6366f1') +
      `<p style="text-align:center;color:rgba(255,255,255,0.25);font-size:12px;margin-top:8px;">Questions? Contact us at <a href="mailto:yosuaawijayaaa@gmail.com" style="color:rgba(99,102,241,0.7);text-decoration:none;">yosuaawijayaaa@gmail.com</a></p>`

    await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [userEmail],
      subject: `✓ Submission received: "${title}"`,
      html: userContent,
    })

    // Email to CEO/admin
    const adminContent =
      `<div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;text-align:center;">
        <span style="color:#818cf8;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">&#128276; New Release Submission</span>
      </div>` +
      releaseCard(title, artistDisplay, coverImage, format, genre) +
      detailsTable([
        { label: 'Artist', value: artistDisplay },
        { label: 'Format', value: format || '—' },
        { label: 'Genre', value: genre || '—' },
        { label: 'Release Date', value: releaseDate || 'TBD' },
        { label: 'Tracks', value: `${tracks?.length || 0}` },
        { label: 'Distribution', value: territories === 'worldwide' ? 'Worldwide' : 'Selected' },
        { label: 'Submitted by', value: userEmail },
        ...(body.spotifyUrl ? [{ label: 'Spotify', value: body.spotifyUrl }] : []),
        ...(body.appleMusicUrl ? [{ label: 'Apple Music', value: body.appleMusicUrl }] : []),
      ]) +
      ctaButton('Review in Admin Panel', `${DASHBOARD_URL}/admin`, '#6366f1')

    await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: ['yosuaawijayaaa@gmail.com'],
      subject: `[New Submission] ${title} — ${artist}`,
      html: emailWrapper(adminContent),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending release email:', error)
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
