import nodemailer from "nodemailer";
import { config } from "../config.js";

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialises the SMTP transporter.
 * - If EMAIL_HOST is set in .env → uses those credentials (Gmail, Outlook, etc.)
 * - Otherwise → auto-creates an Ethereal test account so emails can be
 *   previewed in the browser without any real SMTP server.
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (config.email.host) {
    // Real SMTP (e.g. Gmail with App Password)
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
    console.log(`📧 Email configured via ${config.email.host}`);
  } else {
    // Ethereal test account – emails are viewable at the logged URL
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`📧 Email configured via Ethereal test account: ${testAccount.user}`);
  }

  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMail(options: SendMailOptions) {
  try {
    const t = await getTransporter();

    const info = await t.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✅ Email sent to ${options.to} (messageId: ${info.messageId})`);

    // If using Ethereal, log the preview URL so you can view the email
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\n📨 Email preview URL: ${previewUrl}\n`);
    }

    return { messageId: info.messageId, previewUrl: previewUrl || null };
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${options.to}:`, error.message);
    console.error(`   SMTP config: host=${config.email.host}, port=${config.email.port}, user=${config.email.user}`);
    throw error;
  }
}
