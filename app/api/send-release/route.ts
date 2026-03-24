import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      title, 
      artist, 
      label, 
      releaseDate, 
      genre, 
      format,
      price,
      territories,
      promotionText,
      tracks,
      coverImage
    } = body

    const tracksHTML = tracks?.map((track: any, index: number) => `
      <div style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 4px;">
        <div style="font-weight: 600; color: #1a202c; margin-bottom: 5px;">
          ${index + 1}. ${track.title}
        </div>
        <div style="font-size: 13px; color: #718096;">
          Artist: ${track.artist || 'Same as release'}
        </div>
        <div style="font-size: 13px; color: #3182ce; margin-top: 5px;">
          <a href="${track.driveLink}" target="_blank" style="color: #3182ce;">
            📁 Google Drive Link
          </a>
        </div>
      </div>
    `).join('') || '<p>No tracks added</p>'

    const data = await resend.emails.send({
      from: 'Afterglow Music <onboarding@resend.dev>',
      to: [process.env.RECIPIENT_EMAIL || 'your-email@example.com'],
      subject: `🎵 New Release Submission: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                background: #f7fafc;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 700px;
                margin: 0 auto;
                background: white;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
              }
              .content {
                padding: 30px;
              }
              .section {
                margin-bottom: 30px;
              }
              .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #1a202c;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e2e8f0;
              }
              .field {
                margin-bottom: 15px;
                padding: 12px;
                background: #f7fafc;
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
              }
              .label {
                font-weight: 600;
                color: #4a5568;
                font-size: 14px;
              }
              .value {
                color: #1a202c;
                font-size: 14px;
                text-align: right;
              }
              .cover-image {
                width: 200px;
                height: 200px;
                object-fit: cover;
                border-radius: 8px;
                margin: 15px auto;
                display: block;
              }
              .footer {
                background: #f7fafc;
                padding: 20px;
                text-align: center;
                color: #718096;
                font-size: 13px;
                border-top: 1px solid #e2e8f0;
              }
              .badge {
                display: inline-block;
                padding: 4px 12px;
                background: #48bb78;
                color: white;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎵 New Release Submission</h1>
                <p>Afterglow Music Dashboard</p>
              </div>
              
              <div class="content">
                <!-- Release Information -->
                <div class="section">
                  <div class="section-title">📀 Release Information</div>
                  <div class="field">
                    <span class="label">Release Title</span>
                    <span class="value">${title}</span>
                  </div>
                  <div class="field">
                    <span class="label">Primary Artist</span>
                    <span class="value">${artist}</span>
                  </div>
                  <div class="field">
                    <span class="label">Label</span>
                    <span class="value">${label}</span>
                  </div>
                  <div class="field">
                    <span class="label">Genre</span>
                    <span class="value">${genre}</span>
                  </div>
                  <div class="field">
                    <span class="label">Format</span>
                    <span class="value">${format}</span>
                  </div>
                  <div class="field">
                    <span class="label">Release Date</span>
                    <span class="value">${releaseDate || 'Not specified'}</span>
                  </div>
                </div>

                <!-- Cover Art -->
                ${coverImage ? `
                <div class="section">
                  <div class="section-title">🎨 Cover Art</div>
                  <img src="${coverImage}" alt="Cover Art" class="cover-image" />
                </div>
                ` : ''}

                <!-- Tracks -->
                <div class="section">
                  <div class="section-title">🎼 Track List (${tracks?.length || 0} tracks)</div>
                  ${tracksHTML}
                </div>

                <!-- Pricing & Distribution -->
                <div class="section">
                  <div class="section-title">💰 Pricing & Distribution</div>
                  <div class="field">
                    <span class="label">Price Tier</span>
                    <span class="value">${price || 'Standard'}</span>
                  </div>
                  <div class="field">
                    <span class="label">Territories</span>
                    <span class="value">${territories === 'worldwide' ? 'Worldwide (240 territories)' : 'Selected territories'}</span>
                  </div>
                  <div class="field">
                    <span class="label">Distribution</span>
                    <span class="value">17+ stores (Spotify, Apple Music, etc.)</span>
                  </div>
                </div>

                <!-- Promotion -->
                ${promotionText ? `
                <div class="section">
                  <div class="section-title">📣 Promotion</div>
                  <div style="background: #f7fafc; padding: 15px; border-radius: 4px; white-space: pre-wrap;">
                    ${promotionText}
                  </div>
                </div>
                ` : ''}
              </div>

              <div class="footer">
                <p><strong>Submitted from Afterglow Music Dashboard</strong></p>
                <p>${new Date().toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
