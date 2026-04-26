import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payment/payment.entity';
import { Job } from '../entities/job.entity';
import { PaymentStatus } from './payment-status.enum';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
  ) {}

  /** ADMIN: CREATE PAYMENT — also stores clientPrice on job for payout calculation */
  async initiatePayment(jobId: number, amount: number) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['payment'],
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

    // ── Store clientPrice on the job so payout can be calculated at dispatch ──
    job.clientPrice = amount;
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
    const query = Object.keys(data)
      .filter(k => data[k] !== undefined && data[k] !== '')
      .sort()
      .map(k => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
      .join('&');

    const stringToSign = passphrase
      ? `${query}&passphrase=${encodeURIComponent(passphrase)}`
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
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: process.env.PAYFAST_RETURN_URL!,
      cancel_url: process.env.PAYFAST_CANCEL_URL!,
      notify_url: process.env.PAYFAST_NOTIFY_URL!,
      m_payment_id: String(job.payment.id),
      amount: Number(job.payment.amount).toFixed(2),
      item_name: `BTM Job #${job.id}`,
    };

    const formInputs = Object.entries(data)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}"/>`)
      .join('\n');

    return `
      <html>
        <body onload="document.forms[0].submit()">
          <form action="${process.env.PAYFAST_BASE_URL}" method="POST">
            ${formInputs}
          </form>
          <p>Redirecting to PayFast...</p>
        </body>
      </html>
    `;
  }
}

