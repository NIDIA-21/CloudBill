import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter: nodemailer.Transporter;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Development mode - log to console
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; preview?: string }> {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@brightloop.com',
      to,
      subject,
      html,
    });

    if (!process.env.SMTP_HOST) {
      // Dev mode - parse the JSON transport output
      const parsed = JSON.parse(info.message);
      console.log('\n📧 EMAIL PREVIEW:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html.substring(0, 200)}...`);
      console.log('---');
      return { success: true, preview: html };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error.message);
    return { success: false };
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<{ success: boolean; preview?: string }> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Brightloop Software - Password Reset</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">Reset Password</a>
      <p style="color: #64748b; font-size: 14px;">This link expires in ${process.env.RESET_TOKEN_EXPIRES_HOURS || 2} hours.</p>
      <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Brightloop Software © ${new Date().getFullYear()}</p>
    </div>
  `;
  return sendEmail(email, 'Password Reset - Brightloop Software', html);
}

export async function sendInvoiceEmail(email: string, invoiceNumber: string, customerName: string, total: string, dueDate: string): Promise<{ success: boolean; preview?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Brightloop Software - Invoice ${invoiceNumber}</h2>
      <p>Dear ${customerName},</p>
      <p>A new invoice has been generated for your subscription:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Invoice Number</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">${invoiceNumber}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Amount</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">₹${total}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Due Date</strong></td><td style="padding: 8px; border: 1px solid #e2e8f0;">${dueDate}</td></tr>
      </table>
      <p>Please log in to your customer portal to view and download the invoice.</p>
      <a href="${process.env.FRONTEND_URL}/portal/invoices" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">View Invoice</a>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">Brightloop Software © ${new Date().getFullYear()}</p>
    </div>
  `;
  return sendEmail(email, `Invoice ${invoiceNumber} - Brightloop Software`, html);
}
