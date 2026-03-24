import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, artist, label, releaseDate, genre, format } = body

    const data = await resend.emails.send({
      from: 'Afterglow Music <onboarding@resend.dev>',
      to: [process.env.RECIPIENT_EMAIL || 'your-email@example.com'],
      subject: `New Release Submission: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: #3182ce;
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #f7fafc;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .field {
                margin-bottom: 15px;
                padding: 12px;
                background: white;
                border-radius: 4px;
              }
              .label {
                font-weight: 600;
                color: #4a5568;
                font-size: 13px;
                margin-bottom: 4px;
              }
              .value {
                color: #1a202c;
                font-size: 15px;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                color: #718096;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🎵 New Release Submission</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Afterglow Music Dashboard</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Release Title</div>
                  <div class="value">${title}</div>
                </div>
                <div class="field">
                  <div class="label">Primary Artist</div>
                  <div class="value">${artist}</div>
                </div>
                <div class="field">
                  <div class="label">Label</div>
                  <div class="value">${label}</div>
                </div>
                <div class="field">
                  <div class="label">Genre</div>
                  <div class="value">${genre}</div>
                </div>
                <div class="field">
                  <div class="label">Format</div>
                  <div class="value">${format}</div>
                </div>
                <div class="field">
                  <div class="label">Release Date</div>
                  <div class="value">${releaseDate || 'Not specified'}</div>
                </div>
                <div class="footer">
                  <p>Submitted from Afterglow Music Dashboard</p>
                  <p>${new Date().toLocaleString()}</p>
                </div>
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
