import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  async sendPush(expoPushToken: string | null | undefined, title: string, body: string, data?: Record<string, any>) {
    if (!expoPushToken) return;
    if (!expoPushToken.startsWith('ExponentPushToken')) return;

    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: data ?? {},
      priority: 'high',
      channelId: 'default',
    };

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(message),
      });
      const result = await res.json();
      this.logger.log(`Push sent to ${expoPushToken}: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error(`Failed to send push to ${expoPushToken}:`, err);
    }
  }
}

