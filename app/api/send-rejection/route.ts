import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userEmail, title, artist, reason } = body

    const data = await resend.emails.send({
      from: 'Afterglow Music <releases@mamangstudio.web.id>',
      to: [userEmail],
      subject: `Release Submission Update: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background: #ecf0f1; margin: 0; padding: 0; }
              .wrapper { max-width: 650px; margin: 40px auto; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background: #000; padding: 40px 30px; text-align: center; border-bottom: 4px solid #e74c3c; }
              .logo { font-size: 32px; font-weight: 700; color: #fff; letter-spacing: 1px; margin-bottom: 8px; }
              .tagline { color: #bdc3c7; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; }
              .banner { background: #e74c3c; color: white; padding: 15px 30px; text-align: center; font-weight: 600; font-size: 14px; }
              .content { padding: 40px 30px; }
              .message { background: #f8d7da; border-left: 4px solid #e74c3c; padding: 25px; margin: 30px 0; font-size: 15px; line-height: 1.8; color: #721c24; }
              .title { font-size: 22px; font-weight: 700; color: #000; margin-bottom: 8px; }
              .artist { font-size: 16px; color: #7f8c8d; margin-bottom: 25px; }
              .reason-box { background: #fff3cd; border: 1px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px; }
              .footer { background: #34495e; color: #bdc3c7; padding: 30px; text-align: center; font-size: 12px; }
              .footer-logo { color: #fff; font-size: 18px; font-weight: 700; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header">
                <div class="logo">AFTERGLOW MUSIC</div>
                <div class="tagline">Digital Distribution</div>
              </div>
              
              <div class="banner">SUBMISSION UPDATE</div>
              
              <div class="content">
                <h2 style="font-size: 20px; color: #000; margin-bottom: 20px;">Release Submission Update</h2>
                
                <div class="message">
                  <p style="margin-bottom: 15px;"><strong>Hi ${artist},</strong></p>
                  <p style="margin-bottom: 15px;">
                    Thank you for submitting your release. After reviewing your submission, we're unable to proceed with distribution at this time.
                  </p>
                  <p>Please review the feedback below and feel free to resubmit after making the necessary changes.</p>
                </div>

                <div class="title">${title}</div>
                <div class="artist">${artist}</div>

                <div class="reason-box">
                  <h3 style="color: #856404; font-size: 15px; margin-bottom: 12px;">📋 Feedback</h3>
                  <p style="color: #856404; margin: 0;">${reason}</p>
                </div>

                <div style="background: #e7f3ff; border-left: 4px solid #3498db; padding: 20px; margin: 25px 0;">
                  <h3 style="color: #2c3e50; font-size: 15px; margin-bottom: 12px;">💡 What You Can Do</h3>
                  <ul style="margin-left: 20px; color: #2c3e50;">
                    <li style="margin: 8px 0;">Review the feedback and make necessary corrections</li>
                    <li style="margin: 8px 0;">Ensure all audio files meet quality standards</li>
                    <li style="margin: 8px 0;">Verify cover artwork meets platform requirements (min 3000x3000px)</li>
                    <li style="margin: 8px 0;">Submit your release again through the dashboard</li>
                  </ul>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #7f8c8d;">
                  <strong>Questions?</strong> Feel free to reply to this email and our team will be happy to help.
                </p>
              </div>

              <div class="footer">
                <div class="footer-logo">AFTERGLOW MUSIC</div>
                <div>Digital Music Distribution & Rights Management<br>mamangstudio.web.id</div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error sending rejection email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
