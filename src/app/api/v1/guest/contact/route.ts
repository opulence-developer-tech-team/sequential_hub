import { NextResponse } from "next/server";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { emailService } from "@/lib/server/utils/email";

interface ContactBody {
  fullName: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
  orderNumber?: string;
  preferredContact?: "email" | "phone";
}

async function handler(request: Request): Promise<NextResponse> {
  try {
    await connectDB();

    if (request.method !== "POST") {
      return utils.customResponse({
        status: 405,
        message: MessageResponse.Error,
        description: "Method not allowed. Only POST requests are supported.",
        data: null,
      }) as NextResponse;
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit contact form submissions
    const rateLimitResult = rateLimiter.checkLimit(
      clientIp,
      RATE_LIMITS.UPDATE.maxRequests,
      RATE_LIMITS.UPDATE.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for contact form", {
        clientIp,
      });
      return utils.customResponse({
        status: 429,
        message: MessageResponse.Error,
        description: `Too many requests. Please wait ${Math.ceil(
          (rateLimitResult.resetTime - Date.now()) / 1000
        )} seconds before trying again.`,
        data: {
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        },
      }) as NextResponse;
    }

    let body: ContactBody;
    try {
      body = await request.json();
    } catch (error: any) {
      logger.warn("Invalid JSON in contact request body", {
        clientIp,
        error: error.message,
      });
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Invalid request body. Expected valid JSON.",
        data: null,
      }) as NextResponse;
    }

    const fullName = body.fullName?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim();
    const subject = body.subject?.trim();
    const message = body.message?.trim();

    if (!fullName) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Full name is required.",
        data: null,
      }) as NextResponse;
    }

    const preferredContact: "email" | "phone" =
      body.preferredContact === "phone" ? "phone" : "email";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (preferredContact === "email") {
      if (!email) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Email is required when email is the preferred contact method.",
          data: null,
        }) as NextResponse;
      }

      if (!emailRegex.test(email)) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Please provide a valid email address.",
          data: null,
        }) as NextResponse;
      }
    } else {
      if (!phone) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Phone number is required when phone is the preferred contact method.",
          data: null,
        }) as NextResponse;
      }

      if (email && !emailRegex.test(email)) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Please provide a valid email address.",
          data: null,
        }) as NextResponse;
      }
    }

    if (!subject) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Subject is required.",
        data: null,
      }) as NextResponse;
    }

    if (!message || message.length < 20) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description:
          "Please provide at least 20 characters in your message so our team can assist you properly.",
        data: null,
      }) as NextResponse;
    }

    const adminEmail =
      process.env.DEFAULT_ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!adminEmail) {
      logger.error(
        "DEFAULT_ADMIN_EMAIL or GMAIL_USER not configured for contact form",
        undefined,
        {}
      );
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description:
          "Contact service is temporarily unavailable. Please try again later.",
        data: null,
      }) as NextResponse;
    }

    // Build a luxury tailoring-themed email template
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>New Contact Request - Sequential Hub</title>
        </head>
        <body style="margin:0;padding:0;background:linear-gradient(135deg,#f5f7fb 0%,#e6ecf8 35%,#dfe7fb 100%);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="background:transparent;">
            <tr>
              <td style="padding:32px 16px;">
                <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="max-width:640px;margin:0 auto;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.14);border:1px solid rgba(148,163,184,0.26);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding:32px 32px 24px;background:linear-gradient(135deg,#020617 0%,#0f172a 55%,#1d4ed8 100%);">
                      <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                        <tr>
                          <td style="text-align:left;">
                            <div style="display:inline-flex;align-items:center;gap:10px;">
                              <div style="width:40px;height:40px;border-radius:14px;background:linear-gradient(135deg,#1d4ed8,#38bdf8);display:flex;align-items:center;justify-content:center;">
                                <span style="font-size:20px;">✂️</span>
                              </div>
                              <div>
                                <div style="color:#e5e7eb;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:600;">Sequential Hub</div>
                                <div style="color:#f9fafb;font-size:18px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">
                                  Tailor Contact Request
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:28px 32px 24px;">
                      <p style="margin:0 0 12px;font-size:14px;color:#0f172a;font-weight:600;">
                        A new contact request has been submitted from the website.
                      </p>
                      <p style="margin:0 0 20px;font-size:13px;color:#4b5563;line-height:1.6;">
                        Review the details below and respond via the preferred channel indicated by the client.
                      </p>

                      <!-- Client Summary -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;border-radius:12px;background:#f9fafb;border:1px solid #e5e7eb;">
                        <tr>
                          <td style="padding:14px 16px;">
                            <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                              <tr>
                                <td style="font-size:12px;font-weight:600;color:#6b7280;padding-bottom:4px;text-transform:uppercase;letter-spacing:0.08em;">
                                  Client details
                                </td>
                              </tr>
                              <tr>
                                <td style="font-size:13px;color:#111827;">
                                  <strong>${fullName}</strong>
                                </td>
                              </tr>
                              ${
                                email
                                  ? `<tr><td style="font-size:13px;color:#374151;padding-top:2px;">
                                      <a href="mailto:${email}" style="color:#1d4ed8;text-decoration:none;">${email}</a>
                                    </td></tr>`
                                  : ''
                              }
                              ${
                                phone
                                  ? `<tr><td style="font-size:13px;color:#374151;padding-top:2px;">
                                      Phone: ${phone}
                                    </td></tr>`
                                  : ''
                              }
                              ${
                                body.orderNumber
                                  ? `<tr><td style="font-size:12px;color:#6b7280;padding-top:6px;">
                                      Order: <span style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${body.orderNumber}</span>
                                    </td></tr>`
                                  : ''
                              }
                              <tr>
                                <td style="font-size:12px;color:#6b7280;padding-top:6px;">
                                  Preferred contact: <strong>${
                                    preferredContact === "phone" ? "Phone" : "Email"
                                  }</strong>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Quick Action for Phone Contact -->
                      ${
                        preferredContact === "phone" && phone
                          ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 18px;">
                               <tr>
                                 <td>
                                   <a
                                     href="tel:${phone.replace(/[^+0-9]/g, "")}"
                                     style="display:inline-block;padding:10px 18px;border-radius:999px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#f9fafb;font-size:12px;font-weight:600;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;"
                                   >
                                     Call client
                                   </a>
                                 </td>
                               </tr>
                             </table>`
                          : ""
                      }

                      <!-- Subject -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;">
                        <tr>
                          <td style="padding:10px 14px;">
                            <div style="font-size:11px;color:#1d4ed8;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:4px;">
                              Subject
                            </div>
                            <div style="font-size:13px;color:#111827;font-weight:500;">
                              ${subject}
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Message -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:8px;border-radius:10px;background:#f9fafb;border:1px solid #e5e7eb;">
                        <tr>
                          <td style="padding:14px 16px;">
                            <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">
                              Message
                            </div>
                            <div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">
                              ${message?.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                            </div>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">
                        Submitted from IP: <span style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${clientIp}</span>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:14px 24px 18px;background:#0b1120;border-top:1px solid rgba(148,163,184,0.35);">
                      <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation">
                        <tr>
                          <td style="font-size:11px;color:#e5e7eb;">
                            Sequential Hub · Custom Tailoring &amp; Bespoke Pieces
                          </td>
                        </tr>
                        <tr>
                          <td style="font-size:10px;color:#9ca3af;padding-top:4px;">
                            You are receiving this email because you are listed as an administrator for Sequential Hub.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailSent = await emailService.sendEmail({
      to: adminEmail,
      subject: `New Contact Request - ${subject}`,
      html,
      // Allow replying directly to the sender when an email is provided
      replyTo: email,
    });

    if (!emailSent) {
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description:
          "We could not send your message at this time. Please try again later.",
        data: null,
      }) as NextResponse;
    }

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description:
        "Your message has been received. Our team will get back to you as soon as possible.",
      data: null,
    }) as NextResponse;
  } catch (error: any) {
    logger.error("Unexpected error in contact handler", error?.stack || error?.message, {
      error: error?.message,
    });

    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description:
        "An unexpected error occurred while processing your request. Please try again later.",
      data: null,
    }) as NextResponse;
  }
}

export const POST = handler;


























