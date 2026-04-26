import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payment/payment.entity';
import { Job } from '../entities/job.entity';
import { PaymentStatus } from './payment-status.enum';
import * as crypto from 'crypto';

const PAYOUT_FLOOR = 500;

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
  ) {}

  /** ADMIN: CREATE PAYMENT — stores clientPrice and pre-calculates payout so technician sees it before accepting */
  async initiatePayment(jobId: number, amount: number) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['payment', 'serviceItem'],
    });

    if (!job) throw new NotFoundException('Job not found');

    if (job.payment) {
      return job.payment; // prevent duplicate payments
    }

    const payment = this.paymentRepo.create({
      job,
      amount,
      status: PaymentStatus.PENDING,
    });

    const savedPayment = await this.paymentRepo.save(payment);

    // ── Store clientPrice + pre-calculate payout so technician sees it before accepting ──
    job.clientPrice = amount;
    job.payment = savedPayment;

    if (job.serviceItem?.technicianPercentage != null) {
      const pct = job.serviceItem.technicianPercentage;
      job.technicianPercentage = pct;
      job.technicianPayout = Math.max(amount * pct, PAYOUT_FLOOR);
    }

    await this.jobRepo.save(job);

    return savedPayment;
  }

  /** WEBHOOK / MANUAL CONFIRM */
  async markAsPaid(paymentId: number, providerRef?: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['job'],
    });

    if (!payment) throw new NotFoundException('Payment not found');

    payment.status = PaymentStatus.PAID;
    payment.providerRef = providerRef ?? 'MANUAL';

    return this.paymentRepo.save(payment);
  }

  private generateSignature(data: Record<string, any>, passphrase?: string) {
    const query = Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value)).replace(/%20/g, '+')}`)
      .join('&');

    const stringToSign = passphrase
      ? `${query}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
      : query;

    return crypto.createHash('md5').update(stringToSign).digest('hex');
  }

  verifyPayFastSignature(body: Record<string, any>, passphrase?: string) {
    const data = { ...body };
    delete data.signature;

    const generated = this.generateSignature(data, passphrase);

    return generated === body.signature;
  }

  async createBasicPayFastPayment(jobId: number) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['payment'],
    });

    if (!job || !job.payment) throw new NotFoundException('Payment not initiated');

    const data: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!.trim(),
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!.trim(),
      return_url: process.env.PAYFAST_RETURN_URL!.trim(),
      cancel_url: process.env.PAYFAST_CANCEL_URL!.trim(),
      notify_url: process.env.PAYFAST_NOTIFY_URL!.trim(),
      m_payment_id: String(job.payment.id),
      amount: Number(job.payment.amount).toFixed(2),
      item_name: `BTM Job #${job.id}`,
    };

    const signature = this.generateSignature(
      data,
      process.env.PAYFAST_PASSPHRASE?.trim() || undefined,
    );

    const formInputs = Object.entries({ ...data, signature })
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}"/>`)
      .join('\n');

    // Use the explicit PayFast URL from env to avoid live/sandbox mismatches
    const payfastUrl = process.env.PAYFAST_BASE_URL?.trim() || 'https://www.payfast.co.za/eng/process';

    return `
      <html>
        <body onload="document.forms[0].submit()">
          <form action="${payfastUrl}" method="POST">
            ${formInputs}
          </form>
          <p>Redirecting to PayFast...</p>
        </body>
      </html>
    `;
  }
}

