import {
  Controller,
  Post,
  Get,
  Res,
  Param,
  Body,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post(':jobId/initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  initiate(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Body('amount') amount: number,
  ) {
    return this.paymentService.initiatePayment(jobId, amount);
  }

  @Post(':paymentId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  confirm(
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ) {
    return this.paymentService.markAsPaid(paymentId);
  }

  @Post('itn')
  async payfastITN(@Body() body: any) {
    console.log('💰 PayFast ITN received:', body);

    const paymentId = Number(body.m_payment_id);
    if (!paymentId) return 'INVALID PAYMENT';

    if (body.payment_status === 'COMPLETE') {
      await this.paymentService.markAsPaid(
        paymentId,
        body.pf_payment_id,
      );
    }

    return 'OK';
  }


  @Get(':jobId/payfast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  async createPayFast(@Param('jobId', ParseIntPipe) jobId: number, @Res() res: Response) {
    const html = await this.paymentService.createBasicPayFastPayment(jobId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('return')
    async paymentReturn(@Res() res: Response) {
      res.send(`
        <html>
          <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
            <h1>Payment Completed!</h1>
            <p>You can now return to the app.</p>
          </body>
        </html>
      `);
    }

    // Cancel URL for WebView / browser
    @Get('cancel')
    async paymentCancel(@Res() res: Response) {
      res.send(`
        <html>
          <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
            <h1>Payment Cancelled</h1>
            <p>You can go back to the app and try again.</p>
          </body>
        </html>
      `);
    }

}
