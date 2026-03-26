import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { releaseTitle, artist, userEmail, adminEmail, changes } = body

    // Email to User
    await resend.emails.send({
      from: 'Afterglow Music <noreply@mamangstudio.web.id>',
      to: userEmail,
      subject: `Release Update Confirmation - ${releaseTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                        AFTERGLOW MUSIC
                      </h1>
                      <p style="margin: 8px 0 0 0; color: #cccccc; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
                        Digital Distribution Services
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 22px; font-weight: 600;">
                        Release Update Confirmation
                      </h2>
                      
                      <p style="margin: 0 0 25px 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                        Your release has been successfully updated in our system.
                      </p>

                      <!-- Release Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #3182ce; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                              ${releaseTitle}
                            </p>
                            <p style="margin: 0; color: #6c757d; font-size: 14px;">
                              by ${artist}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Changes Section -->
                      <div style="margin: 0 0 30px 0;">
                        <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
                          Updates Made:
                        </p>
                        <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
                          ${changes.map((change: string) => `<li>${change}</li>`).join('')}
                        </ul>
                      </div>

                      <!-- Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4f8; border-radius: 6px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 16px 20px;">
                            <p style="margin: 0; color: #0c5460; font-size: 13px; line-height: 1.6;">
                              <strong>Note:</strong> Your updated release will be reviewed by our team. You will receive a notification once the review is complete.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                        If you have any questions or need assistance, please don't hesitate to contact our support team.
                      </p>

                      <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                        Best regards,<br>
                        <strong>Afterglow Music Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px 40px; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} Afterglow Music. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
                        <a href="https://mamangstudio.web.id" style="color: #3182ce; text-decoration: none;">mamangstudio.web.id</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    // Email to Admin
    await resend.emails.send({
      from: 'Afterglow Music System <noreply@mamangstudio.web.id>',
      to: process.env.RECIPIENT_EMAIL || adminEmail,
      subject: `[ADMIN] Release Updated - ${releaseTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                        AFTERGLOW MUSIC
                      </h1>
                      <p style="margin: 8px 0 0 0; color: #cccccc; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
                        Admin Notification System
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 0 0 25px 0;">
                        <tr>
                          <td style="padding: 16px 20px;">
                            <p style="margin: 0; color: #856404; font-size: 13px; font-weight: 600;">
                              ⚠️ ADMIN ALERT: Release Updated
                            </p>
                          </td>
                        </tr>
                      </table>

                      <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 22px; font-weight: 600;">
                        Release Update Notification
                      </h2>
                      
                      <p style="margin: 0 0 25px 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                        A user has updated their release submission.
                      </p>

                      <!-- Release Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #3182ce; margin: 0 0 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                              ${releaseTitle}
                            </p>
                            <p style="margin: 0 0 12px 0; color: #6c757d; font-size: 14px;">
                              by ${artist}
                            </p>
                            <p style="margin: 0; color: #6c757d; font-size: 13px;">
                              <strong>User:</strong> ${userEmail}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Changes Section -->
                      <div style="margin: 0 0 30px 0;">
                        <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
                          Changes Made:
                        </p>
                        <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
                          ${changes.map((change: string) => `<li>${change}</li>`).join('')}
                        </ul>
                      </div>

                      <!-- Action Required -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4f8; border-radius: 6px; margin: 0 0 25px 0;">
                        <tr>
                          <td style="padding: 16px 20px;">
                            <p style="margin: 0; color: #0c5460; font-size: 13px; line-height: 1.6;">
                              <strong>Action Required:</strong> Please review the updated release in the admin dashboard.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                        <strong>Timestamp:</strong> ${new Date().toLocaleString('en-US', { 
                          dateStyle: 'full', 
                          timeStyle: 'long',
                          timeZone: 'Asia/Jakarta'
                        })}
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px 40px; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} Afterglow Music. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
                        <a href="https://mamangstudio.web.id" style="color: #3182ce; text-decoration: none;">mamangstudio.web.id</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending edit notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
