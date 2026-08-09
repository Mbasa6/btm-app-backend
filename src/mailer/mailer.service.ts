import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter | null = null;

  private get transporterConfig() {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    };
  }

  private isConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.MAIL_FROM);
  }

  private getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport(this.transporterConfig);
    }

    return this.transporter;
  }

  async sendPasswordResetCode(email: string, code: string) {
    if (!this.isConfigured()) {
      throw new Error('SMTP mailer is not configured.');
    }

    await this.getTransporter().sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'BTM Fibre Connect password reset code',
      text: `Your BTM Fibre Connect password reset code is ${code}. It expires in 15 minutes. If you did not request this, you can ignore this email.`,
      html: `<p>Your BTM Fibre Connect password reset code is <strong>${code}</strong>.</p><p>This code expires in 15 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
    });
  }
}

