import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private get primaryTransporterConfig(): SMTPTransport.Options {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 15000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000),
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

  private getCandidateConfigs() {
    const primary = this.primaryTransporterConfig;
    const configs: Array<SMTPTransport.Options> = [primary];

    // Resend supports multiple SMTP ports; try alternates if primary times out.
    if (primary.host === 'smtp.resend.com') {
      const fallbacks = [
        { port: 587, secure: false },
        { port: 2587, secure: false },
        { port: 465, secure: true },
        { port: 2465, secure: true },
      ];

      for (const fallback of fallbacks) {
        if (fallback.port === primary.port && fallback.secure === primary.secure) {
          continue;
        }

        configs.push({
          ...primary,
          port: fallback.port,
          secure: fallback.secure,
        });
      }
    }

    return configs;
  }

  async sendPasswordResetCode(email: string, code: string) {
    if (!this.isConfigured()) {
      throw new Error('SMTP mailer is not configured.');
    }

    const configs = this.getCandidateConfigs();
    let lastError: unknown;

    for (let index = 0; index < configs.length; index += 1) {
      const config = configs[index];

      try {
        const transporter = nodemailer.createTransport(config);
        await transporter.sendMail({
          from: process.env.MAIL_FROM,
          to: email,
          subject: 'BTM Fibre Connect password reset code',
          text: `Your BTM Fibre Connect password reset code is ${code}. It expires in 15 minutes. If you did not request this, you can ignore this email.`,
          html: `<p>Your BTM Fibre Connect password reset code is <strong>${code}</strong>.</p><p>This code expires in 15 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
        });

        if (index > 0) {
          this.logger.warn(
            `SMTP send succeeded via fallback transport ${String(config.host)}:${String(config.port)} (secure=${String(config.secure)}).`,
          );
        }

        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `SMTP send failed via ${String(config.host)}:${String(config.port)} (secure=${String(config.secure)}): ${
            (error as any)?.message || String(error)
          }`,
        );
      }
    }

    throw lastError instanceof Error ? lastError : new Error('SMTP send failed after trying all transport options.');
  }
}
