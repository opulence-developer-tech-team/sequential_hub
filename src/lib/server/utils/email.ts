import nodemailer from "nodemailer";
import { logger } from "./logger";

// Gmail SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
  });
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export const emailService = {
  /**
   * Send email using Gmail SMTP
   */
  async sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<boolean> {
    try {
      // Validate environment variables
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        logger.error(
          "Gmail SMTP credentials not configured",
          new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables"),
          {}
        );
        return false;
      }

      const transporter = createTransporter();

      // Verify transporter configuration
      await transporter.verify();

      // Send email
      const info = await transporter.sendMail({
        from: `"Sequential Hub" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
        ...(replyTo ? { replyTo } : {}),
      });

      logger.info("Email sent successfully", {
        messageId: info.messageId,
        to,
        subject,
      });

      return true;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to send email", err, {
        to,
        subject,
      });
      return false;
    }
  },

  /**
   * Generate email verification HTML template with luxury blue theme and tailoring/sewing design
   */
  generateOTPEmailTemplate(otp: string, firstName: string, verificationToken?: string): string {
    const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo/logo.png`;
    const verificationUrl = verificationToken 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`
      : null;
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Verify Your Email - Sequential Hub</title>
          <!--[if mso]>
          <style type="text/css">
            body, table, td {font-family: Arial, sans-serif !important;}
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%); font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%);">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 113, 227, 0.15), 0 4px 12px rgba(0, 113, 227, 0.1); border: 1px solid rgba(0, 113, 227, 0.1);">
                  
                  <!-- Header with Luxury Blue Gradient and Tailoring Theme -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 50%, #38bdf8 100%); padding: 0; position: relative; overflow: hidden;">
                      <!-- Decorative Thread Pattern Background -->
                      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px), repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px);"></div>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding: 26px 24px 22px; text-align: center; position: relative;">
                            <!-- Logo Container -->
                            <div style="margin: 0 auto 14px; width: 56px; height: 56px; background-color: #ffffff; border-radius: 14px; display: inline-block; padding: 6px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18); border: 1px solid rgba(255, 255, 255, 0.45);">
                              <img src="${logoUrl}" alt="Sequential Hub Logo" width="44" height="44" style="display: block; width: 44px; height: 44px; border-radius: 12px;" />
                            </div>
                            
                            <!-- Brand Name -->
                            <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.4px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);">Sequential Hub</h1>
                            <p style="margin: 0 0 14px 0; color: rgba(255, 255, 255, 0.92); font-size: 12px; font-weight: 500; letter-spacing: 1.2px; text-transform: uppercase;">Premium Custom Clothing</p>
                            
                            <!-- Decorative Thread Line with Needle -->
                            <div style="margin: 0 auto; width: 100px; height: 3px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent); border-radius: 2px; position: relative;">
                              <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; background: rgba(255,255,255,0.8); border-radius: 50%; box-shadow: 0 0 8px rgba(255,255,255,0.5);"></div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 50px 40px; background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);">
                      <!-- Greeting with Tailoring Theme -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; padding: 14px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 14px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.1); border: 2px solid #e0f2fe;">
                          <span style="font-size: 36px; filter: drop-shadow(0 2px 4px rgba(0,113,227,0.2));">✉️</span>
                        </div>
                        <h2 style="margin: 0 0 12px 0; color: #1d1d1f; font-size: 26px; font-weight: 700; line-height: 1.3;">
                          Welcome, ${firstName}!
                        </h2>
                        <div style="width: 60px; height: 3px; background: linear-gradient(90deg, transparent, #0071e3, transparent); margin: 0 auto; border-radius: 2px;"></div>
                      </div>
                      
                      <p style="margin: 0 0 24px 0; color: #424245; font-size: 16px; line-height: 1.7; text-align: center;">
                        Thank you for joining Sequential Hub! We're excited to have you as part of our community of style enthusiasts. Just like our master tailors carefully craft each clothing, we're here to create something special for you.
                      </p>
                      
                      <p style="margin: 0 0 40px 0; color: #424245; font-size: 16px; line-height: 1.7; text-align: center;">
                        To complete your registration and start exploring our collection of premium custom-tailored clothing, please verify your email address by clicking the button below:
                      </p>

                      ${verificationUrl ? `
                      <!-- Verification Button with Luxury Blue Gradient -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 35px;">
                        <tr>
                          <td align="center">
                            <a href="${verificationUrl}" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 50%, #38bdf8 100%); color: #ffffff; font-size: 17px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 113, 227, 0.4), 0 4px 8px rgba(0, 113, 227, 0.2); letter-spacing: 0.3px; text-transform: uppercase; transition: all 0.3s ease;">
                              ✉️ Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      
                      <!-- Alternative Link with Stitching Border -->
                      ${verificationUrl ? `
                      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%); border: 2px dashed #0ea5e9; border-radius: 12px; padding: 20px; margin-bottom: 35px; box-shadow: 0 2px 8px rgba(0, 113, 227, 0.08);">
                        <p style="margin: 0 0 12px 0; color: #0369a1; font-size: 13px; line-height: 1.5; font-weight: 600; text-align: center;">
                          📎 If the button doesn't work, copy and paste this link:
                        </p>
                        <div style="background: #ffffff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 14px; text-align: center;">
                          <a href="${verificationUrl}" style="color: #0071e3; text-decoration: none; font-size: 13px; font-family: 'Courier New', monospace; word-break: break-all; font-weight: 500;">${verificationUrl}</a>
                        </div>
                      </div>
                      ` : ''}
                      
                      <!-- Security Notice with Tailoring Theme -->
                      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 5px solid #0071e3; border-radius: 12px; padding: 22px 24px; margin: 0 0 35px; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.1); position: relative;">
                        <div style="position: absolute; top: -8px; right: 20px; width: 16px; height: 16px; background: #0071e3; border-radius: 50%; box-shadow: 0 2px 6px rgba(0, 113, 227, 0.3);"></div>
                        <p style="margin: 0 0 10px 0; color: #0369a1; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 20px;">🔒</span> Security Note
                        </p>
                        <p style="margin: 0; color: #075985; font-size: 14px; line-height: 1.7;">
                          This verification link will expire in <strong style="color: #0071e3;">24 hours</strong>. If you didn't create an account with Sequential Hub, please ignore this email. Your account security is as important to us as the precision in our tailoring.
                        </p>
                      </div>
                      
                      <!-- Decorative Divider with Thread Pattern -->
                      <div style="margin: 35px 0; text-align: center; position: relative;">
                        <div style="display: inline-block; width: 120px; height: 2px; background: repeating-linear-gradient(to right, #0071e3 0px, #0071e3 8px, transparent 8px, transparent 16px); position: relative;">
                          <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 100%); border-radius: 50%; box-shadow: 0 0 8px rgba(0, 113, 227, 0.4);"></div>
                        </div>
                      </div>
                      
                      <!-- Help Text -->
                      <p style="margin: 0; color: #6e6e73; font-size: 15px; line-height: 1.7; text-align: center;">
                        Need help? Our tailoring team is here for you. Contact us at <a href="mailto:support@sequentialhub.com" style="color: #0071e3; text-decoration: none; font-weight: 600; border-bottom: 1px solid rgba(0, 113, 227, 0.3);">support@sequentialhub.com</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer with Luxury Blue Accent -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%); padding: 35px 40px; text-align: center; border-top: 3px solid #0071e3; position: relative;">
                      <!-- Decorative Thread Line at Top -->
                      <div style="position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 200px; height: 2px; background: repeating-linear-gradient(to right, #0ea5e9 0px, #0ea5e9 6px, transparent 6px, transparent 12px);"></div>
                      
                      <div style="margin-bottom: 16px;">
                        <span style="display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, rgba(0, 113, 227, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%); border: 1px solid rgba(0, 113, 227, 0.2); border-radius: 8px; color: #0071e3; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                          ✂️ Sequential Hub
                        </span>
                      </div>
                      <p style="margin: 0 0 10px 0; color: #6e6e73; font-size: 13px; line-height: 1.6; font-weight: 500;">
                        Crafted with precision. Designed for you.
                      </p>
                      <p style="margin: 0 0 12px 0; color: #86868b; font-size: 12px; font-weight: 400;">
                        © ${new Date().getFullYear()} Sequential Hub. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #a1a1a6; font-size: 11px;">
                        Premium Custom Clothing & Tailoring
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  },

  /**
   * Generate measurement order price notification email HTML template
   */
  generateMeasurementOrderPriceEmailTemplate(
    orderNumber: string,
    customerName: string,
    price: number,
    paymentLink: string,
    isGuest: boolean,
    baseUrl?: string,
    tax?: number | null,
    deliveryFee?: number | null,
    totalAmount?: number | null
  ): string {
    const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackOrderLink = `${appUrl}/track-order/${orderNumber}`;
    const sewingMachineImage = `${appUrl}/icon/sewing-machine.png`;
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Measurement Order Price - Sequential Hub</title>
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #faf9f6 0%, #f5f3f0 50%, #f0ede8 100%); font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #faf9f6 0%, #f5f3f0 50%, #f0ede8 100%);">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); border: 1px solid #e8e6e1;">
                  
                  <!-- Header with Sewing Machine -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%); padding: 50px 30px 40px; text-align: center; position: relative; overflow: hidden;">
                      <!-- Decorative thread pattern background -->
                      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.05; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);"></div>
                      <!-- Sewing Machine Image -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="text-align: center; padding-bottom: 20px;">
                            <img src="${sewingMachineImage}" alt="Sewing Machine" style="width: 120px; height: auto; display: block; margin: 0 auto; filter: brightness(0) invert(1); opacity: 0.9;" />
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 3px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Sequential Hub</h1>
                      <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 400; letter-spacing: 2px; text-transform: uppercase;">Master Tailors & Custom Clothing</p>
                      <!-- Decorative stitching line -->
                      <div style="margin: 20px auto 0; width: 100px; height: 2px; background: repeating-linear-gradient(to right, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 8px, transparent 8px, transparent 16px);"></div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 50px 40px; background: #ffffff;">
                      <!-- Decorative top border with thread pattern -->
                      <div style="margin: 0 0 30px 0; text-align: center;">
                        <div style="display: inline-block; width: 200px; height: 1px; background: repeating-linear-gradient(to right, #d4a574 0px, #d4a574 6px, transparent 6px, transparent 12px);"></div>
                      </div>
                      
                      <h2 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 32px; font-weight: 600; text-align: center;">
                        Hello ${customerName}!
                      </h2>
                      
                      <p style="margin: 0 0 30px 0; color: #5a5a5a; font-size: 17px; line-height: 1.8; text-align: center;">
                        Great news! Our master tailors have carefully reviewed your measurement order <strong style="color: #2c3e50;">#${orderNumber}</strong> and have prepared a custom quote for your bespoke clothing.
                      </p>
                      
                      <!-- Price Display with Tailoring Theme -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 40px; background: linear-gradient(135deg, #fff8f0 0%, #fef5e7 50%, #fdf2e9 100%); border: 3px solid #d4a574; border-radius: 20px; box-shadow: 0 4px 15px rgba(212, 165, 116, 0.2);">
                        <tr>
                          <td style="padding: 45px 50px; text-align: center; position: relative;">
                            <!-- Decorative corner elements -->
                            <div style="position: absolute; top: 15px; left: 15px; width: 30px; height: 30px; border-left: 2px solid #d4a574; border-top: 2px solid #d4a574; border-radius: 5px 0 0 0;"></div>
                            <div style="position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; border-right: 2px solid #d4a574; border-top: 2px solid #d4a574; border-radius: 0 5px 0 0;"></div>
                            <div style="position: absolute; bottom: 15px; left: 15px; width: 30px; height: 30px; border-left: 2px solid #d4a574; border-bottom: 2px solid #d4a574; border-radius: 0 0 0 5px;"></div>
                            <div style="position: absolute; bottom: 15px; right: 15px; width: 30px; height: 30px; border-right: 2px solid #d4a574; border-bottom: 2px solid #d4a574; border-radius: 0 0 5px 0;"></div>
                            
                            <p style="margin: 0 0 12px 0; color: #8b6f47; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px;">
                              Base Price (Before Tax & Delivery)
                            </p>
                            <p style="margin: 0; color: #2c3e50; font-size: 52px; font-weight: 700; letter-spacing: -2px; font-family: 'Georgia', serif;">
                              ₦${price.toLocaleString('en-NG')}
                            </p>
                            <p style="margin: 12px 0 0 0; color: #8b6f47; font-size: 13px; font-style: italic;">
                              Handcrafted with precision
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      ${
                        tax !== undefined || deliveryFee !== undefined || totalAmount !== undefined
                          ? `
                      <!-- Detailed Pricing Summary -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 40px; background: #fdfcf9; border-radius: 16px; border: 1px solid #e2dccf;">
                        <tr>
                          <td style="padding: 24px 28px;">
                            <p style="margin: 0 0 14px 0; color: #3c3c3c; font-size: 15px; font-weight: 600;">
                              Price Breakdown
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 4px 0; color: #6b6b6b; font-size: 14px;">Base Price</td>
                                <td style="padding: 4px 0; text-align: right; color: #2c3e50; font-size: 14px; font-weight: 500;">
                                  ₦${price.toLocaleString('en-NG')}
                                </td>
                              </tr>
                              ${
                                deliveryFee !== undefined && deliveryFee !== null
                                  ? `
                              <tr>
                                <td style="padding: 4px 0; color: #6b6b6b; font-size: 14px;">Delivery Fee</td>
                                <td style="padding: 4px 0; text-align: right; color: #2c3e50; font-size: 14px; font-weight: 500;">
                                  ${deliveryFee === 0 ? 'Free' : '₦' + deliveryFee.toLocaleString('en-NG')}
                                </td>
                              </tr>
                              `
                                  : ''
                              }
                              ${
                                tax !== undefined && tax !== null
                                  ? `
                              <tr>
                                <td style="padding: 4px 0; color: #6b6b6b; font-size: 14px;">Tax</td>
                                <td style="padding: 4px 0; text-align: right; color: #2c3e50; font-size: 14px; font-weight: 500;">
                                  ₦${tax.toLocaleString('en-NG')}
                                </td>
                              </tr>
                              `
                                  : ''
                              }
                              <tr>
                                <td style="padding-top: 10px; border-top: 1px solid #e2dccf; color: #2c3e50; font-size: 15px; font-weight: 600;">
                                  Estimated Total
                                </td>
                                <td style="padding-top: 10px; border-top: 1px solid #e2dccf; text-align: right; color: #2c3e50; font-size: 18px; font-weight: 700;">
                                  ₦${(totalAmount !== undefined && totalAmount !== null
                                      ? totalAmount
                                      : price + (deliveryFee || 0) + (tax || 0)
                                    ).toLocaleString('en-NG')}
                                </td>
                              </tr>
                            </table>
                            <p style="margin: 10px 0 0 0; color: #8b6f47; font-size: 12px; font-style: italic;">
                              Final amount charged at payment may include applicable taxes and delivery adjustments.
                            </p>
                          </td>
                        </tr>
                      </table>
                      `
                          : ''
                      }
                      
                      <p style="margin: 0 0 40px 0; color: #5a5a5a; font-size: 16px; line-height: 1.8; text-align: center;">
                        ${isGuest 
                          ? 'To proceed with payment and begin crafting your custom clothing, please click the button below. You\'ll be able to complete your payment securely through our payment gateway.'
                          : 'To complete your payment, please log in to your account and navigate to the <strong style="color: #2c3e50;">Measurement Orders</strong> tab in your Orders screen. You can also click the button below to proceed directly to payment.'
                        }
                      </p>
                      
                      <!-- Payment Button with Tailoring Theme -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="text-align: center; padding: 0 0 40px;">
                            <a href="${paymentLink}" style="display: inline-block; padding: 18px 52px; background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 17px; font-weight: 600; box-shadow: 0 6px 20px rgba(44, 62, 80, 0.4); letter-spacing: 0.5px; transition: all 0.3s ease;">
                              ${isGuest ? '✨ Pay Now & Start Tailoring' : '✨ Complete Payment'}
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Order Tracking Information -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0; background: linear-gradient(135deg, #f8f6f3 0%, #f5f3f0 100%); border-radius: 16px; border: 2px dashed #d4a574;">
                        <tr>
                          <td style="padding: 35px 40px; text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #2c3e50; font-size: 17px; font-weight: 600;">
                              📍 Track Your Order
                            </p>
                            <p style="margin: 0 0 20px 0; color: #5a5a5a; font-size: 15px; line-height: 1.7;">
                              Follow the progress of your custom clothing from measurement to completion. <strong style="color: #2c3e50;">No account required!</strong>
                            </p>
                            
                            <!-- Click to Track Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 20px;">
                              <tr>
                                <td style="text-align: center;">
                                  <a href="${trackOrderLink}" style="display: inline-block; padding: 14px 36px; background: #ffffff; color: #2c3e50; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; border: 2px solid #d4a574; box-shadow: 0 3px 10px rgba(212, 165, 116, 0.2);">
                                    Click to Track Order
                                  </a>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Order Number for Copying -->
                            <div style="margin: 0 auto; max-width: 400px;">
                              <p style="margin: 0 0 8px 0; color: #5a5a5a; font-size: 13px; font-weight: 500;">
                                Or copy your order number and paste it on the tracking page:
                              </p>
                              <div style="background: #ffffff; border: 2px solid #d4a574; border-radius: 8px; padding: 12px 20px; margin: 0 auto; display: inline-block; font-family: 'Courier New', monospace; font-size: 16px; font-weight: 600; color: #2c3e50; letter-spacing: 1px; user-select: all; -webkit-user-select: all; -moz-user-select: all; -ms-user-select: all; cursor: text;">
                                ${orderNumber}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      ${isGuest ? `
                        <p style="margin: 0 0 24px 0; color: #5a5a5a; font-size: 14px; line-height: 1.7; text-align: center; font-style: italic;">
                          <strong style="color: #2c3e50;">Note:</strong> If you'd like to create an account to track all your orders, you can do so after completing your payment.
                        </p>
                      ` : ''}
                      
                      <!-- Decorative bottom border -->
                      <div style="margin: 30px 0 0 0; text-align: center;">
                        <div style="display: inline-block; width: 200px; height: 1px; background: repeating-linear-gradient(to right, #d4a574 0px, #d4a574 6px, transparent 6px, transparent 12px);"></div>
                      </div>
                      
                      <p style="margin: 30px 0 0 0; color: #5a5a5a; font-size: 15px; line-height: 1.7; text-align: center;">
                        If you have any questions about this quote or your custom clothing, our tailoring team is here to help. Don't hesitate to contact us!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 45px 40px; background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px;">
                        Sequential Hub
                      </p>
                      <p style="margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.8); font-size: 13px; font-style: italic;">
                        Master Tailors & Premium Custom Clothing
                      </p>
                      <!-- Decorative stitching line -->
                      <div style="margin: 0 auto 20px; width: 150px; height: 1px; background: repeating-linear-gradient(to right, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 6px, transparent 6px, transparent 12px);"></div>
                      <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 12px;">
                        Need help? Contact us at <a href="mailto:support@sequentialhub.com" style="color: #d4a574; text-decoration: none; font-weight: 500;">support@sequentialhub.com</a>
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  },

  /**
   * Generate password reset email HTML template with luxury blue theme and tailoring/sewing design
   */
  generatePasswordResetEmailTemplate(firstName: string, resetUrl: string): string {
    const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo/logo.png`;
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Reset Your Password - Sequential Hub</title>
          <!--[if mso]>
          <style type="text/css">
            body, table, td {font-family: Arial, sans-serif !important;}
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%); font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%);">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 113, 227, 0.15), 0 4px 12px rgba(0, 113, 227, 0.1); border: 1px solid rgba(0, 113, 227, 0.1);">
                  
                  <!-- Header with Luxury Blue Gradient and Tailoring Theme -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 50%, #38bdf8 100%); padding: 0; position: relative; overflow: hidden;">
                      <!-- Decorative Thread Pattern Background -->
                      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px), repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px);"></div>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding: 26px 24px 22px; text-align: center; position: relative;">
                            <!-- Logo Container -->
                            <div style="margin: 0 auto 14px; width: 56px; height: 56px; background-color: #ffffff; border-radius: 14px; display: inline-block; padding: 6px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18); border: 1px solid rgba(255, 255, 255, 0.45);">
                              <img src="${logoUrl}" alt="Sequential Hub Logo" width="44" height="44" style="display: block; width: 44px; height: 44px; border-radius: 12px;" />
                            </div>
                            
                            <!-- Brand Name -->
                            <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.4px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);">Sequential Hub</h1>
                            <p style="margin: 0 0 14px 0; color: rgba(255, 255, 255, 0.92); font-size: 12px; font-weight: 500; letter-spacing: 1.2px; text-transform: uppercase;">Premium Custom Clothing</p>
                            
                            <!-- Decorative Thread Line with Needle -->
                            <div style="margin: 0 auto; width: 100px; height: 3px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent); border-radius: 2px; position: relative;">
                              <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; background: rgba(255,255,255,0.8); border-radius: 50%; box-shadow: 0 0 8px rgba(255,255,255,0.5);"></div>
                            </div>
                            
                            <!-- Lock Icon -->
                            <div style="margin-top: 20px; display: inline-block; padding: 10px 18px; background: rgba(255,255,255,0.2); border-radius: 24px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3);">
                              <span style="color: #ffffff; font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🔐</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 50px 40px; background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);">
                      <!-- Greeting with Tailoring Theme -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; padding: 14px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 14px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.1); border: 2px solid #e0f2fe;">
                          <span style="font-size: 36px; filter: drop-shadow(0 2px 4px rgba(0,113,227,0.2));">🔓</span>
                        </div>
                        <h2 style="margin: 0 0 12px 0; color: #1d1d1f; font-size: 26px; font-weight: 700; line-height: 1.3;">
                          Hello ${firstName},
                        </h2>
                        <div style="width: 60px; height: 3px; background: linear-gradient(90deg, transparent, #0071e3, transparent); margin: 0 auto; border-radius: 2px;"></div>
                      </div>
                      
                      <p style="margin: 0 0 24px 0; color: #424245; font-size: 16px; line-height: 1.7; text-align: center;">
                        We received a request to reset your password for your Sequential Hub account. Just like our master tailors carefully craft each piece of clothing, we want to ensure your account security is perfectly tailored.
                      </p>
                      
                      <p style="margin: 0 0 40px 0; color: #424245; font-size: 16px; line-height: 1.7; text-align: center;">
                        Click the button below to create a new password:
                      </p>

                      <!-- Reset Button with Luxury Blue Gradient -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 35px;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 50%, #38bdf8 100%); color: #ffffff; font-size: 17px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 113, 227, 0.4), 0 4px 8px rgba(0, 113, 227, 0.2); letter-spacing: 0.3px; text-transform: uppercase; transition: all 0.3s ease;">
                              🔓 Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Alternative Link with Stitching Border -->
                      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%); border: 2px dashed #0ea5e9; border-radius: 12px; padding: 20px; margin-bottom: 35px; box-shadow: 0 2px 8px rgba(0, 113, 227, 0.08);">
                        <p style="margin: 0 0 12px 0; color: #0369a1; font-size: 13px; line-height: 1.5; font-weight: 600; text-align: center;">
                          📎 If the button doesn't work, copy and paste this link:
                        </p>
                        <div style="background: #ffffff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 14px; text-align: center;">
                          <a href="${resetUrl}" style="color: #0071e3; text-decoration: none; font-size: 13px; font-family: 'Courier New', monospace; word-break: break-all; font-weight: 500;">${resetUrl}</a>
                        </div>
                      </div>
                      
                      <!-- Security Notice with Tailoring Theme -->
                      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 5px solid #0071e3; border-radius: 12px; padding: 22px 24px; margin: 0 0 35px; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.1); position: relative;">
                        <div style="position: absolute; top: -8px; right: 20px; width: 16px; height: 16px; background: #0071e3; border-radius: 50%; box-shadow: 0 2px 6px rgba(0, 113, 227, 0.3);"></div>
                        <p style="margin: 0 0 10px 0; color: #0369a1; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 20px;">🔒</span> Security Notice
                        </p>
                        <p style="margin: 0; color: #075985; font-size: 14px; line-height: 1.7;">
                          This link will expire in <strong style="color: #0071e3;">1 hour</strong>. If you didn't request a password reset, please ignore this email or contact our support team if you have concerns. Your account security is as important to us as the precision in our tailoring.
                        </p>
                      </div>
                      
                      <!-- Decorative Divider with Thread Pattern -->
                      <div style="margin: 35px 0; text-align: center; position: relative;">
                        <div style="display: inline-block; width: 120px; height: 2px; background: repeating-linear-gradient(to right, #0071e3 0px, #0071e3 8px, transparent 8px, transparent 16px); position: relative;">
                          <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 100%); border-radius: 50%; box-shadow: 0 0 8px rgba(0, 113, 227, 0.4);"></div>
                        </div>
                      </div>
                      
                      <!-- Help Text -->
                      <p style="margin: 0; color: #6e6e73; font-size: 15px; line-height: 1.7; text-align: center;">
                        Need help? Our tailoring team is here for you. Contact us at <a href="mailto:support@sequentialhub.com" style="color: #0071e3; text-decoration: none; font-weight: 600; border-bottom: 1px solid rgba(0, 113, 227, 0.3);">support@sequentialhub.com</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer with Luxury Blue Accent -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%); padding: 35px 40px; text-align: center; border-top: 3px solid #0071e3; position: relative;">
                      <!-- Decorative Thread Line at Top -->
                      <div style="position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 200px; height: 2px; background: repeating-linear-gradient(to right, #0ea5e9 0px, #0ea5e9 6px, transparent 6px, transparent 12px);"></div>
                      
                      <div style="margin-bottom: 16px;">
                        <span style="display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, rgba(0, 113, 227, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%); border: 1px solid rgba(0, 113, 227, 0.2); border-radius: 8px; color: #0071e3; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                          ✂️ Sequential Hub
                        </span>
                      </div>
                      <p style="margin: 0 0 10px 0; color: #6e6e73; font-size: 13px; line-height: 1.6; font-weight: 500;">
                        Crafted with precision. Designed for you.
                      </p>
                      <p style="margin: 0 0 12px 0; color: #86868b; font-size: 12px; font-weight: 400;">
                        © ${new Date().getFullYear()} Sequential Hub. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #a1a1a6; font-size: 11px;">
                        This email was sent because a password reset was requested for your account.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  },

  /**
   * Generate payment confirmation email HTML template with luxury blue theme and tailoring/sewing design
   */
  generatePaymentConfirmationEmailTemplate(
    orderNumber: string,
    customerName: string,
    isGuest: boolean,
    orderType: 'regular' | 'measurement',
    baseUrl?: string,
    orderDetails?: {
      subtotal?: number
      shipping?: number
      tax?: number
      total: number
      deliveryFee?: number
    }
  ): string {
    const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackOrderLink = `${appUrl}/track-order/${orderNumber}`;
    const logoUrl = `${appUrl}/logo/logo.png`;
    const loginUrl = `${appUrl}/sign-in`;
    const accountOrdersUrl = `${appUrl}/account?tab=orders`;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Payment Confirmed - Sequential Hub</title>
          <!--[if mso]>
          <style type="text/css">
            body, table, td {font-family: Arial, sans-serif !important;}
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%); font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%);">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 113, 227, 0.15), 0 4px 12px rgba(0, 113, 227, 0.1); border: 1px solid rgba(0, 113, 227, 0.1);">
                  
                  <!-- Header with Luxury Blue Gradient and Tailoring Theme -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 50%, #38bdf8 100%); padding: 0; position: relative; overflow: hidden;">
                      <!-- Decorative Thread Pattern Background -->
                      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px), repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px);"></div>
                      
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding: 26px 24px 22px; text-align: center; position: relative;">
                            <!-- Logo Container -->
                            <div style="margin: 0 auto 14px; width: 56px; height: 56px; background-color: #ffffff; border-radius: 14px; display: inline-block; padding: 6px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18); border: 1px solid rgba(255, 255, 255, 0.45);">
                              <img src="${logoUrl}" alt="Sequential Hub Logo" width="44" height="44" style="display: block; width: 44px; height: 44px; border-radius: 12px;" />
                            </div>
                            
                            <!-- Brand Name -->
                            <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.4px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);">Sequential Hub</h1>
                            <p style="margin: 0 0 14px 0; color: rgba(255, 255, 255, 0.92); font-size: 12px; font-weight: 500; letter-spacing: 1.2px; text-transform: uppercase;">Premium Custom Clothing</p>
                            
                            <!-- Decorative Thread Line with Needle -->
                            <div style="margin: 0 auto; width: 100px; height: 3px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent); border-radius: 2px; position: relative;">
                              <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; background: rgba(255,255,255,0.8); border-radius: 50%; box-shadow: 0 0 8px rgba(255,255,255,0.5);"></div>
                            </div>
                            
                            <!-- Success Icon -->
                            <div style="margin-top: 20px; display: inline-block; padding: 10px 18px; background: rgba(255,255,255,0.2); border-radius: 24px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3);">
                              <span style="color: #ffffff; font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">✅</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 50px 40px; background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);">
                      <!-- Greeting with Tailoring Theme -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; padding: 14px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 14px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 113, 227, 0.1); border: 2px solid #e0f2fe;">
                          <span style="font-size: 36px; filter: drop-shadow(0 2px 4px rgba(0,113,227,0.2));">🎉</span>
                        </div>
                        <h2 style="margin: 0 0 12px 0; color: #1d1d1f; font-size: 26px; font-weight: 700; line-height: 1.3;">
                          Payment Confirmed!
                        </h2>
                        <p style="margin: 0; color: #6e6e73; font-size: 16px; line-height: 1.6;">
                          Hello ${customerName},
                        </p>
                      </div>
                      
                      <!-- Success Message -->
                      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; border-radius: 16px; padding: 30px; margin: 0 0 35px 0; text-align: center;">
                        <p style="margin: 0 0 15px 0; color: #065f46; font-size: 17px; font-weight: 600; line-height: 1.6;">
                          Your payment has been successfully processed!
                        </p>
                        <p style="margin: 0; color: #047857; font-size: 15px; line-height: 1.7;">
                          We've received your payment and your ${orderType === 'regular' ? 'order' : 'measurement order'} is now being processed by our master tailors.
                        </p>
                      </div>
                      
                      <!-- Order Number Display -->
                      <div style="background: linear-gradient(135deg, #fff8f0 0%, #fef5e7 100%); border: 3px solid #0071e3; border-radius: 20px; padding: 35px; margin: 0 0 35px 0; text-align: center; box-shadow: 0 4px 15px rgba(0, 113, 227, 0.15);">
                        <p style="margin: 0 0 12px 0; color: #0071e3; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px;">
                          Your Order Number
                        </p>
                        <p style="margin: 0; color: #1d1d1f; font-size: 20px; font-weight: 700; letter-spacing: -1px; font-family: 'Courier New', monospace; user-select: all; -webkit-user-select: all;">
                          ${orderNumber}
                        </p>
                        <p style="margin: 12px 0 0 0; color: #6e6e73; font-size: 13px; font-style: italic;">
                          Save this number for tracking your order
                        </p>
                      </div>
                      
                      ${orderDetails ? `
                        <!-- Payment Summary -->
                        <div style="background: linear-gradient(135deg, #1d1d1f 0%, #2d2d2f 100%); border-radius: 16px; padding: 30px; margin: 0 0 35px 0; color: #ffffff;">
                          <h3 style="margin: 0 0 20px 0; color: #ffffff; font-size: 18px; font-weight: 600; text-align: center;">
                            Payment Summary
                          </h3>
                          <div style="space-y: 12px;">
                            ${orderDetails.subtotal !== undefined ? `
                              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <span style="color: rgba(255,255,255,0.8); font-size: 14px;">Subtotal: </span>
                                <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${new Intl.NumberFormat('en', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(orderDetails.subtotal)}</span>
                              </div>
                            ` : ''}
                            ${orderDetails.shipping !== undefined ? `
                              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <span style="color: rgba(255,255,255,0.8); font-size: 14px;">Shipping</span>
                                <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${orderDetails.shipping === 0 ? 'Free' : new Intl.NumberFormat('en', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(orderDetails.shipping)}</span>
                              </div>
                            ` : ''}
                            ${orderDetails.deliveryFee !== undefined && orderDetails.deliveryFee !== null ? `
                              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <span style="color: rgba(255,255,255,0.8); font-size: 14px;">Delivery Fee: </span>
                                <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${new Intl.NumberFormat('en', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(orderDetails.deliveryFee)}</span>
                              </div>
                            ` : ''}
                            ${orderDetails.tax !== undefined && orderDetails.tax !== null ? `
                              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <span style="color: rgba(255,255,255,0.8); font-size: 14px;">Tax: </span>
                                <span style="color: #ffffff; font-size: 14px; font-weight: 500;">${new Intl.NumberFormat('en', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(orderDetails.tax)}</span>
                              </div>
                            ` : ''}
                            <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 2px solid rgba(255,255,255,0.2);">
                              <span style="color: #ffffff; font-size: 18px; font-weight: 600;">Total Paid: </span>
                              <span style="color: #ffffff; font-size: 20px; font-weight: 700;">${new Intl.NumberFormat('en', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(orderDetails.total)}</span>
                            </div>
                          </div>
                        </div>
                      ` : ''}
                      
                      ${isGuest ? `
                        <!-- Guest User: Tracking Link -->
                        <div style="background: linear-gradient(135deg, #f8f6f3 0%, #f5f3f0 100%); border-radius: 16px; border: 2px dashed #0071e3; padding: 35px; margin: 0 0 35px 0; text-align: center;">
                          <p style="margin: 0 0 8px 0; color: #1d1d1f; font-size: 18px; font-weight: 600;">
                            📍 Track Your Order
                          </p>
                          <p style="margin: 0 0 25px 0; color: #6e6e73; font-size: 15px; line-height: 1.7;">
                            Track your order status in real-time using the link below. No account required!
                          </p>
                          
                          <!-- Track Order Button -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="text-align: center;">
                                <a href="${trackOrderLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 6px 20px rgba(0, 113, 227, 0.4); letter-spacing: 0.5px;">
                                  Track Order #${orderNumber}
                                </a>
                              </td>
                            </tr>
                          </table>
                        </div>
                      ` : `
                        <!-- User with Account: Login Instructions -->
                        <div style="background: linear-gradient(135deg, #f8f6f3 0%, #f5f3f0 100%); border-radius: 16px; border: 2px dashed #0071e3; padding: 35px; margin: 0 0 35px 0; text-align: center;">
                          <p style="margin: 0 0 8px 0; color: #1d1d1f; font-size: 18px; font-weight: 600;">
                            📋 View Your Orders
                          </p>
                          <p style="margin: 0 0 20px 0; color: #6e6e73; font-size: 15px; line-height: 1.7;">
                            Please log in to your account and navigate to the <strong style="color: #1d1d1f;">Orders</strong> section to view all your orders and track this order.
                          </p>
                          
                          <!-- Login Button -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 20px;">
                            <tr>
                              <td style="text-align: center;">
                                <a href="${loginUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 15px rgba(0, 113, 227, 0.3);">
                                  Log In to Your Account
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Alternative: Track Order Link -->
                          <p style="margin: 0 0 12px 0; color: #6e6e73; font-size: 14px;">
                            Or track this order directly on the tracking page:
                          </p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="text-align: center;">
                                <a href="${trackOrderLink}" style="display: inline-block; padding: 12px 32px; background: #ffffff; color: #0071e3; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600; border: 2px solid #0071e3; box-shadow: 0 3px 10px rgba(0, 113, 227, 0.2);">
                                  Click to track order
                                </a>
                              </td>
                            </tr>
                          </table>
                        </div>
                      `}
                      
                      <!-- Next Steps -->
                      <div style="border-top: 2px solid #e5e7eb; padding-top: 30px; margin-top: 30px;">
                        <p style="margin: 0 0 15px 0; color: #1d1d1f; font-size: 17px; font-weight: 600; text-align: center;">
                          What's Next?
                        </p>
                        <p style="margin: 0 0 20px 0; color: #6e6e73; font-size: 15px; line-height: 1.8; text-align: center;">
                          ${orderType === 'regular' 
                            ? 'Your order is being prepared and will be shipped to you soon. You\'ll receive updates as your order progresses through our fulfillment process.'
                            : 'Our master tailors will begin crafting your custom clothing based on your measurements. You\'ll receive updates as your order progresses through each stage of production.'
                          }
                        </p>
                        <p style="margin: 0; color: #6e6e73; font-size: 14px; line-height: 1.7; text-align: center; font-style: italic;">
                          If you have any questions, our team is here to help. Don't hesitate to contact us!
                        </p>
                      </div>
                      
                      <!-- Decorative bottom border -->
                      <div style="margin: 30px 0 0 0; text-align: center;">
                        <div style="display: inline-block; width: 200px; height: 1px; background: repeating-linear-gradient(to right, #0071e3 0px, #0071e3 6px, transparent 6px, transparent 12px);"></div>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 45px 40px; background: linear-gradient(135deg, #0071e3 0%, #0ea5e9 50%, #38bdf8 100%); text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px;">
                        Sequential Hub
                      </p>
                      <p style="margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-style: italic;">
                        Premium Custom Clothing & Master Tailoring
                      </p>
                      <!-- Decorative stitching line -->
                      <div style="margin: 0 auto 20px; width: 150px; height: 1px; background: repeating-linear-gradient(to right, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 6px, transparent 6px, transparent 12px);"></div>
                      <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 12px;">
                        Need help? Contact us at <a href="mailto:support@sequentialhub.com" style="color: #ffffff; text-decoration: underline; font-weight: 500;">support@sequentialhub.com</a>
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  },
};







