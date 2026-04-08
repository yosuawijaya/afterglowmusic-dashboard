// Shared branded email template for Afterglow Music

export const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mamangstudio.web.id'

export const emailWrapper = (content: string, previewText = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Afterglow Music</title>
</head>
<body style="margin:0;padding:0;background:#08080f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08080f;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#0d0d1f 0%,#12122a 100%);border-radius:16px 16px 0 0;padding:28px 40px 24px;text-align:center;border-bottom:1px solid rgba(99,102,241,0.25);">
            <div style="margin:0 auto 10px;text-align:center;">
              <span style="background:linear-gradient(135deg,#6366f1,#ec4899);border-radius:10px;padding:7px 18px;display:inline-block;">
                <span style="color:white;font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">AFTERGLOW MUSIC</span>
              </span>
            </div>
            <div style="color:rgba(255,255,255,0.25);font-size:10px;letter-spacing:2px;text-transform:uppercase;">Artist Distribution Portal</div>          </td>
        </tr>
        <tr>
          <td style="background:#0d0d1f;padding:36px 40px;border-left:1px solid rgba(255,255,255,0.05);border-right:1px solid rgba(255,255,255,0.05);">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background:#080810;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(255,255,255,0.05);border-top:1px solid rgba(99,102,241,0.12);">
            <div style="color:rgba(255,255,255,0.4);font-size:13px;font-weight:700;margin-bottom:6px;">Afterglow Music</div>
            <div style="color:rgba(255,255,255,0.18);font-size:11px;line-height:1.8;">
              Digital Music Distribution &amp; Rights Management<br/>
              You're receiving this because you have an account on Afterglow Music.<br/>
              <a href="${DASHBOARD_URL}" style="color:rgba(99,102,241,0.6);text-decoration:none;">Visit Dashboard</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

export const greeting = (name: string) =>
  `<p style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:20px;">Hi <strong style="color:rgba(255,255,255,0.85);">${name}</strong>,</p>`

export const releaseCard = (title: string, artist: string, coverImage?: string, format?: string, genre?: string) =>
  `<table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;width:100%;">
    <tr><td style="text-align:center;">
      ${coverImage
        ? `<img src="${coverImage}" alt="${title}" width="160" height="160" style="border-radius:14px;display:block;margin:0 auto 18px;box-shadow:0 20px 60px rgba(0,0,0,0.7);object-fit:cover;border:1px solid rgba(255,255,255,0.06);"/>`
        : `<div style="width:160px;height:160px;background:linear-gradient(135deg,#1a1a3e,#2d1b69);border-radius:14px;margin:0 auto 18px;border:1px solid rgba(255,255,255,0.08);display:inline-block;"></div>`
      }
      <div style="color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;margin-bottom:6px;line-height:1.2;">${title}</div>
      <div style="color:rgba(255,255,255,0.45);font-size:14px;margin-bottom:${format || genre ? '12px' : '0'};">${artist}</div>
      ${format || genre ? `<div style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);">${[format, genre].filter(Boolean).join(' · ')}</div>` : ''}
    </td></tr>
  </table>`

export const detailsTable = (rows: { label: string; value: string }[]) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;margin-bottom:24px;">
    ${rows.map((row, i) => `
      <tr>
        <td style="padding:11px 18px;color:rgba(255,255,255,0.3);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;width:38%;${i < rows.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.04);' : ''}">${row.label}</td>
        <td style="padding:11px 18px;color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;${i < rows.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.04);' : ''}">${row.value}</td>
      </tr>`).join('')}
  </table>`

export const ctaButton = (text: string, url: string, color = '#6366f1') =>
  `<table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
    <tr>
      <td style="background:linear-gradient(135deg,${color},#7c3aed);border-radius:10px;box-shadow:0 8px 24px rgba(99,102,241,0.35);">
        <a href="${url}" style="display:inline-block;padding:13px 32px;color:white;text-decoration:none;font-size:14px;font-weight:700;">${text} &rarr;</a>
      </td>
    </tr>
  </table>`

export const statusBadge = (label: string, color: string, bg: string, border: string) =>
  `<table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
    <tr>
      <td style="background:${bg};border:1px solid ${border};border-radius:50px;padding:9px 22px;">
        <span style="color:${color};font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">&#9679; ${label}</span>
      </td>
    </tr>
  </table>`

export const messageBox = (text: string, bg: string, border: string, icon = '') =>
  `<div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:18px 22px;margin-bottom:24px;">
    ${icon ? `<span style="font-size:18px;margin-right:8px;">${icon}</span>` : ''}
    <p style="color:rgba(255,255,255,0.75);font-size:14px;line-height:1.7;margin:0;display:inline;">${text}</p>
  </div>`

export const divider = () =>
  `<div style="height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,0.2),transparent);margin:24px 0;"></div>`

// ===== SPECIFIC EMAIL BUILDERS =====

export const buildApprovalEmail = (artist: string, title: string, releaseDate: string, coverImage?: string, format?: string, genre?: string) =>
  emailWrapper(
    greeting(artist) +
    statusBadge('Release Approved', '#10b981', 'rgba(16,185,129,0.1)', 'rgba(16,185,129,0.3)') +
    releaseCard(title, artist, coverImage, format, genre) +
    messageBox(
      `Great news! <strong>"${title}"</strong> has been approved and is now being distributed to all platforms. Your music will be live on Spotify, Apple Music, YouTube Music, and 120+ other platforms by your release date.`,
      'rgba(16,185,129,0.07)', 'rgba(16,185,129,0.2)'
    ) +
    detailsTable([
      { label: 'Release Date', value: releaseDate },
      { label: 'Distribution', value: 'Worldwide (240 territories)' },
      { label: 'Platforms', value: '120+ stores' },
      { label: 'Your Royalty Share', value: '85% of net revenue' },
    ]) +
    ctaButton('View Release', `${DASHBOARD_URL}/dashboard`, '#10b981') +
    `<p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin-top:8px;">Share your pre-save link with fans while you wait for release day.</p>`,
    `"${title}" has been approved for distribution!`
  )

export const buildRejectionEmail = (artist: string, title: string, reason: string, coverImage?: string) =>
  emailWrapper(
    greeting(artist) +
    statusBadge('Revision Required', '#f87171', 'rgba(239,68,68,0.1)', 'rgba(239,68,68,0.3)') +
    releaseCard(title, artist, coverImage) +
    messageBox(
      `Your release <strong>"${title}"</strong> requires some changes before it can be distributed. Please review the feedback below and resubmit.`,
      'rgba(239,68,68,0.07)', 'rgba(239,68,68,0.2)'
    ) +
    `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 22px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Feedback from our team</div>
      <p style="color:rgba(255,255,255,0.75);font-size:14px;line-height:1.7;margin:0;">${reason}</p>
    </div>` +
    ctaButton('Edit &amp; Resubmit', `${DASHBOARD_URL}/dashboard`, '#6366f1') +
    `<p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin-top:8px;">Our team is here to help. Reply to this email if you have questions.</p>`,
    `Action required: "${title}" needs revision`
  )
