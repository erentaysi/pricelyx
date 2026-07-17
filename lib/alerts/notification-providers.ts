/**
 * E-Posta Bildirim Sağlayıcısı (Skeleton)
 * 
 * Şimdilik gerçek e-posta göndermiyor.
 * İleride Nodemailer, Resend, SendGrid vb. entegre edilecek.
 * Log'a yazarak çalıştığını doğrular.
 */
import { INotificationProvider, AlertNotification } from './types';

export class EmailNotificationProvider implements INotificationProvider {
  async send(notification: AlertNotification): Promise<boolean> {
    // ─── İleride gerçek e-posta gönderimi buraya gelecek ───
    // Örnek:
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({
    //   to: notification.email,
    //   subject: `${notification.productTitle} fiyatı düştü!`,
    //   html: buildEmailTemplate(notification)
    // });

    console.log(
      `[EmailProvider] ALERT TRIGGERED → ${notification.email} | ` +
      `Product: ${notification.productTitle} | ` +
      `Target: ${notification.targetPrice}₺ → Current: ${notification.currentPrice}₺ | ` +
      `Drop: %${notification.priceDrop.toFixed(1)}`
    );

    return true; // Başarılı gönderim simülasyonu
  }
}

/**
 * Telegram Bildirim Sağlayıcısı (Skeleton)
 * İleride Telegram Bot API ile entegre edilecek.
 */
export class TelegramNotificationProvider implements INotificationProvider {
  async send(notification: AlertNotification): Promise<boolean> {
    console.log(`[TelegramProvider] Would send to ${notification.email}: ${notification.productTitle}`);
    return true;
  }
}
