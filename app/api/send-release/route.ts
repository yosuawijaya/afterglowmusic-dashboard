import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      title, 
      artist,
      featuringArtists,
      label, 
      releaseDate, 
      genre, 
      format,
      price,
      territories,
      promotionText,
      tracks,
      coverImage,
      userEmail
    } = body

    // SECURITY: Sanitize inputs to prevent XSS
    const sanitize = (str: string) => {
      if (!str) return ''
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
    }

    const safeTitle = sanitize(title)
    const safeArtist = sanitize(artist)
    const safeFeaturingArtists = sanitize(featuringArtists)
    const safeGenre = sanitize(genre)
    const safeFormat = sanitize(format)
    const safePromotionText = sanitize(promotionText)

    // Email 1: Ke Admin (detail lengkap)
    const adminEmail = await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [process.env.RECIPIENT_EMAIL || 'your-email@example.com'],
      subject: `New Release Submission: ${safeTitle} - ${safeArtist}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #2c3e50;
                background: #ecf0f1;
              }
              .email-wrapper {
                max-width: 650px;
                margin: 40px auto;
                background: #ffffff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .header {
                background: #000000;
                padding: 40px 30px;
                text-align: center;
                border-bottom: 4px solid #e74c3c;
              }
              .logo {
                font-size: 32px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: 1px;
                margin-bottom: 8px;
              }
              .tagline {
                color: #bdc3c7;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
              }
              .alert-banner {
                background: #e74c3c;
                color: white;
                padding: 15px 30px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                letter-spacing: 0.5px;
              }
              .content {
                padding: 40px 30px;
              }
              .release-title {
                font-size: 24px;
                font-weight: 700;
                color: #000000;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .artist-name {
                font-size: 18px;
                color: #7f8c8d;
                margin-bottom: 30px;
                font-weight: 500;
              }
              .info-grid {
                display: table;
                width: 100%;
                margin-bottom: 30px;
                border: 1px solid #ecf0f1;
              }
              .info-row {
                display: table-row;
              }
              .info-row:nth-child(even) {
                background: #f8f9fa;
              }
              .info-label {
                display: table-cell;
                padding: 14px 20px;
                font-weight: 600;
                color: #34495e;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                width: 40%;
                border-bottom: 1px solid #ecf0f1;
              }
              .info-value {
                display: table-cell;
                padding: 14px 20px;
                color: #2c3e50;
                font-size: 14px;
                border-bottom: 1px solid #ecf0f1;
              }
              .section-header {
                font-size: 16px;
                font-weight: 700;
                color: #000000;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 40px 0 20px 0;
                padding-bottom: 10px;
                border-bottom: 3px solid #000000;
              }
              .cover-container {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: #f8f9fa;
              }
              .cover-image {
                max-width: 300px;
                width: 100%;
                height: auto;
                border: 1px solid #ddd;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              }
              .track-list {
                margin: 20px 0;
              }
              .track-item {
                background: #ffffff;
                border: 1px solid #e0e0e0;
                padding: 18px 20px;
                margin-bottom: 12px;
              }
              .track-number {
                display: inline-block;
                background: #000000;
                color: white;
                width: 28px;
                height: 28px;
                line-height: 28px;
                text-align: center;
                border-radius: 50%;
                font-weight: 700;
                font-size: 13px;
                margin-right: 12px;
              }
              .track-title {
                font-weight: 700;
                color: #000000;
                font-size: 15px;
                margin-bottom: 6px;
              }
              .track-artist {
                color: #7f8c8d;
                font-size: 13px;
                margin-bottom: 8px;
              }
              .track-link {
                display: inline-block;
                color: #3498db;
                text-decoration: none;
                font-size: 13px;
                font-weight: 600;
                padding: 6px 12px;
                background: #ecf0f1;
                border-radius: 4px;
                margin-top: 6px;
              }
              .track-link:hover {
                background: #3498db;
                color: white;
              }
              .promo-box {
                background: #f8f9fa;
                border-left: 4px solid #e74c3c;
                padding: 20px;
                margin: 20px 0;
                font-size: 14px;
                line-height: 1.8;
                color: #2c3e50;
              }
              .footer {
                background: #34495e;
                color: #bdc3c7;
                padding: 30px;
                text-align: center;
                font-size: 12px;
              }
              .footer-logo {
                color: #ffffff;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 10px;
              }
              .footer-text {
                margin: 8px 0;
                line-height: 1.6;
              }
              .timestamp {
                color: #95a5a6;
                font-size: 11px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #4a5f7f;
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">AFTERGLOW MUSIC</div>
                <div class="tagline">Digital Distribution</div>
              </div>
              
              <div class="alert-banner">
                NEW RELEASE SUBMISSION RECEIVED
              </div>
              
              <div class="content">
                <div class="release-title">${safeTitle}</div>
                <div class="artist-name">${safeArtist}${safeFeaturingArtists ? ` feat. ${safeFeaturingArtists}` : ''}</div>
                
                <div class="section-header">Release Details</div>
                <div class="info-grid">
                  <div class="info-row">
                    <div class="info-label">Label</div>
                    <div class="info-value">${sanitize(label)}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Genre</div>
                    <div class="info-value">${safeGenre}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Format</div>
                    <div class="info-value">${safeFormat}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Release Date</div>
                    <div class="info-value">${releaseDate || 'TBD'}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Price Tier</div>
                    <div class="info-value">${price ? price.charAt(0).toUpperCase() + price.slice(1) : 'Standard'}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Distribution</div>
                    <div class="info-value">${territories === 'worldwide' ? 'Worldwide - 240 Territories' : 'Selected Territories'}</div>
                  </div>
                  ${body.spotifyUrl ? `
                  <div class="info-row">
                    <div class="info-label">Spotify Artist</div>
                    <div class="info-value">${body.spotifyUrl.startsWith('http') ? `<a href="${body.spotifyUrl}" target="_blank" style="color: #1DB954;">${body.spotifyUrl}</a>` : body.spotifyUrl}</div>
                  </div>
                  ` : ''}
                  ${body.appleMusicUrl ? `
                  <div class="info-row">
                    <div class="info-label">Apple Music Artist</div>
                    <div class="info-value">${body.appleMusicUrl.startsWith('http') ? `<a href="${body.appleMusicUrl}" target="_blank" style="color: #FA243C;">${body.appleMusicUrl}</a>` : body.appleMusicUrl}</div>
                  </div>
                  ` : ''}
                </div>

                ${coverImage ? `
                <div class="section-header">Cover Artwork</div>
                <div class="cover-container">
                  <p style="margin: 0; color: #7f8c8d;">
                    <a href="${coverImage}" target="_blank" style="color: #3498db; text-decoration: none;">
                      📁 View Cover Art on Google Drive
                    </a>
                  </p>
                </div>
                ` : ''}

                <div class="section-header">Track Listing</div>
                <div class="track-list">
                  ${tracks?.map((track: any, index: number) => `
                    <div class="track-item">
                      <span class="track-number">${index + 1}</span>
                      <div style="display: inline-block; vertical-align: top; width: calc(100% - 45px);">
                        <div class="track-title">${sanitize(track.title)}</div>
                        <div class="track-artist">Artist: ${sanitize(track.artist || artist)}</div>
                        <a href="${sanitize(track.driveLink)}" class="track-link" target="_blank">📁 View Audio File</a>
                      </div>
                    </div>
                  `).join('') || '<p>No tracks specified</p>'}
                </div>

                ${promotionText ? `
                <div class="section-header">Promotional Information</div>
                <div class="promo-box">${safePromotionText.replace(/\n/g, '<br>')}</div>
                ` : ''}
              </div>

              <div class="footer">
                <div class="footer-logo">AFTERGLOW MUSIC</div>
                <div class="footer-text">
                  Digital Music Distribution & Rights Management<br>
                  mamangstudio.web.id
                </div>
                <div class="timestamp">
                  Submitted: ${new Date().toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    // Email 2: Ke User (konfirmasi submission)
    const userEmailResponse = await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [body.userEmail],
      subject: `Release Submission Received: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #2c3e50;
                background: #ecf0f1;
              }
              .email-wrapper {
                max-width: 650px;
                margin: 40px auto;
                background: #ffffff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .header {
                background: #000000;
                padding: 40px 30px;
                text-align: center;
                border-bottom: 4px solid #27ae60;
              }
              .logo {
                font-size: 32px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: 1px;
                margin-bottom: 8px;
              }
              .tagline {
                color: #bdc3c7;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 2px;
              }
              .alert-banner {
                background: #27ae60;
                color: white;
                padding: 15px 30px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                letter-spacing: 0.5px;
              }
              .content {
                padding: 40px 30px;
              }
              .message-box {
                background: #f8f9fa;
                border-left: 4px solid #27ae60;
                padding: 25px;
                margin: 30px 0;
                font-size: 15px;
                line-height: 1.8;
                color: #2c3e50;
              }
              .release-title {
                font-size: 22px;
                font-weight: 700;
                color: #000000;
                margin-bottom: 8px;
              }
              .artist-name {
                font-size: 16px;
                color: #7f8c8d;
                margin-bottom: 25px;
              }
              .info-box {
                background: #ffffff;
                border: 1px solid #e0e0e0;
                padding: 20px;
                margin: 20px 0;
              }
              .info-row {
                padding: 10px 0;
                border-bottom: 1px solid #ecf0f1;
                display: flex;
                justify-content: space-between;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                font-weight: 600;
                color: #34495e;
                font-size: 13px;
              }
              .info-value {
                color: #2c3e50;
                font-size: 13px;
              }
              .status-badge {
                display: inline-block;
                background: #f39c12;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 13px;
                margin: 20px 0;
              }
              .next-steps {
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
              }
              .next-steps h3 {
                color: #856404;
                font-size: 15px;
                margin-bottom: 12px;
              }
              .next-steps ul {
                margin-left: 20px;
                color: #856404;
              }
              .next-steps li {
                margin: 8px 0;
                font-size: 14px;
              }
              .footer {
                background: #34495e;
                color: #bdc3c7;
                padding: 30px;
                text-align: center;
                font-size: 12px;
              }
              .footer-logo {
                color: #ffffff;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 10px;
              }
              .footer-text {
                margin: 8px 0;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">AFTERGLOW MUSIC</div>
                <div class="tagline">Digital Distribution</div>
              </div>
              
              <div class="alert-banner">
                ✓ SUBMISSION RECEIVED
              </div>
              
              <div class="content">
                <h2 style="font-size: 20px; color: #000; margin-bottom: 20px;">Thank You for Your Submission!</h2>
                
                <div class="message-box">
                  <p style="margin-bottom: 15px;">
                    <strong>Hi ${artist},</strong>
                  </p>
                  <p style="margin-bottom: 15px;">
                    We've successfully received your release submission. Our team is now reviewing your content and will process it for distribution.
                  </p>
                  <p>
                    You'll receive updates via email as your release moves through our review and distribution process.
                  </p>
                </div>

                <div class="release-title">${safeTitle}</div>
                <div class="artist-name">${safeArtist}${safeFeaturingArtists ? ` feat. ${safeFeaturingArtists}` : ''}</div>
                
                <span class="status-badge">⏳ Under Review</span>

                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Format</span>
                    <span class="info-value">${safeFormat}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Genre</span>
                    <span class="info-value">${safeGenre}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Release Date</span>
                    <span class="info-value">${releaseDate || 'TBD'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Tracks</span>
                    <span class="info-value">${tracks?.length || 0} track(s)</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Distribution</span>
                    <span class="info-value">${territories === 'worldwide' ? 'Worldwide' : 'Selected Territories'}</span>
                  </div>
                </div>

                <div class="next-steps">
                  <h3>📋 What Happens Next?</h3>
                  <ul>
                    <li>Our team will review your audio files and metadata</li>
                    <li>We'll verify your cover artwork meets platform requirements</li>
                    <li>Your release will be prepared for distribution to all platforms</li>
                    <li>You'll receive confirmation once your release goes live</li>
                  </ul>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #7f8c8d;">
                  <strong>Questions?</strong> Feel free to reply to this email or contact our support team.
                </p>
              </div>

              <div class="footer">
                <div class="footer-logo">AFTERGLOW MUSIC</div>
                <div class="footer-text">
                  Digital Music Distribution & Rights Management<br>
                  mamangstudio.web.id
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ 
      success: true, 
      adminEmail: adminEmail.data,
      userEmail: userEmailResponse.data 
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
