/**
 * AI Smart Price Alert - Ana Servis Katmanı
 * 
 * Alarm oluşturma, değerlendirme ve tetikleme mantığı.
 * Veritabanı (Supabase) ile çalışır.
 */
import { supabase } from '@/lib/supabase';
import { PriceAlert, AlertType, AlertEvaluation, INotificationProvider, AlertNotification } from './types';
import { calculateAiPriceTarget } from './ai-price-target';
import { EmailNotificationProvider } from './notification-providers';

export class AlertService {
  private notificationProvider: INotificationProvider;

  constructor(provider?: INotificationProvider) {
    // Default: E-posta sağlayıcısı. İleride Telegram, Push vb. ile değiştirilebilir.
    this.notificationProvider = provider || new EmailNotificationProvider();
  }

  // ─── ALARM OLUŞTURMA ─────────────────────────────────────
  async createAlert(params: {
    productId: string;
    email: string;
    alertType: AlertType;
    targetPrice?: number;
    percentageThreshold?: number;
    userId?: string | null;
  }): Promise<{ success: boolean; message: string; alert?: PriceAlert }> {

    const { productId, email, alertType, targetPrice, percentageThreshold, userId } = params;

    // ─ Validasyon ─
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Geçersiz e-posta adresi.' };
    }

    // ─ Hedef Fiyatı Hesapla (Alarm tipine göre) ─
    let computedTargetPrice: number;

    switch (alertType) {
      case 'target_price': {
        if (!targetPrice || targetPrice <= 0) {
          return { success: false, message: 'Lütfen geçerli bir hedef fiyat girin.' };
        }
        computedTargetPrice = targetPrice;
        break;
      }

      case 'percentage_drop': {
        if (!percentageThreshold || percentageThreshold <= 0 || percentageThreshold > 99) {
          return { success: false, message: 'Lütfen %1 ile %99 arasında bir yüzde girin.' };
        }
        const currentPrice = await this.getCurrentLowestPrice(productId);
        if (!currentPrice) return { success: false, message: 'Ürün fiyatı bulunamadı.' };
        computedTargetPrice = Math.round(currentPrice * (1 - percentageThreshold / 100));
        break;
      }

      case 'lowest_30d': {
        const lowest30 = await this.getHistoricalLowest(productId, 30);
        if (!lowest30) return { success: false, message: 'Son 30 günlük yeterli fiyat verisi yok.' };
        computedTargetPrice = lowest30;
        break;
      }

      case 'lowest_90d': {
        const lowest90 = await this.getHistoricalLowest(productId, 90);
        if (!lowest90) return { success: false, message: 'Son 90 günlük yeterli fiyat verisi yok.' };
        computedTargetPrice = lowest90;
        break;
      }

      case 'ai_recommended': {
        const recommendation = await this.getAiRecommendation(productId);
        if (!recommendation) return { success: false, message: 'Yeterli fiyat verisi olmadığı için AI önerisi oluşturulamadı.' };
        computedTargetPrice = recommendation.recommendedPrice;
        break;
      }

      default:
        return { success: false, message: 'Geçersiz alarm tipi.' };
    }

    // ─ Duplicate Kontrolü ─
    const { data: existing } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('product_id', productId)
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (existing) {
      // Mevcut alarmı güncelle
      const { error } = await supabase
        .from('price_alerts')
        .update({
          target_price: computedTargetPrice,
          is_active: true,
          is_triggered: false,
          user_id: userId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
      return { success: true, message: `Fiyat alarmınız ${computedTargetPrice}₺ olarak güncellendi!` };
    }

    // ─ Yeni Alarm Oluştur ─
    const { error } = await supabase
      .from('price_alerts')
      .insert({
        product_id: productId,
        email,
        target_price: computedTargetPrice,
        is_active: true,
        is_triggered: false,
        user_id: userId || null
      });

    if (error) throw error;
    return { success: true, message: `Fiyat alarmınız ${computedTargetPrice}₺ hedefiyle kuruldu!` };
  }

  // ─── ALARM DEĞERLENDİRME (Cron Job tarafından çağrılacak) ─
  async evaluateAlerts(): Promise<{ triggered: number; total: number }> {
    const { data: activeAlerts } = await supabase
      .from('price_alerts')
      .select('*, products(title, slug)')
      .eq('is_active', true)
      .eq('is_triggered', false);

    if (!activeAlerts || activeAlerts.length === 0) {
      return { triggered: 0, total: 0 };
    }

    // 1. Batch fetch lowest prices for all relevant products
    const productIds = Array.from(new Set(activeAlerts.map(a => a.product_id)));
    
    // Not: Çok fazla ürün varsa chunk'lara bölmek gerekebilir (şimdilik limit koymuyoruz veya IN operatörü 1000'e kadar destekler)
    const { data: allPrices } = await supabase
      .from('product_prices')
      .select('product_id, price')
      .in('product_id', productIds);

    // Ürün bazında en düşük fiyatı bul
    const lowestPrices = new Map<string, number>();
    if (allPrices) {
      for (const p of allPrices) {
        const currentMin = lowestPrices.get(p.product_id);
        if (!currentMin || p.price < currentMin) {
          lowestPrices.set(p.product_id, p.price);
        }
      }
    }

    let triggeredCount = 0;
    const triggeredAlertIds: string[] = [];

    for (const alert of activeAlerts) {
      try {
        const currentPrice = lowestPrices.get(alert.product_id);
        if (!currentPrice) continue;

        // Fiyat, hedef fiyatın altına düşmüş mü?
        if (currentPrice <= alert.target_price) {
          const product = alert.products as any;
          const notification: AlertNotification = {
            alertId: alert.id,
            email: alert.email,
            productTitle: product?.title || 'Ürün',
            productSlug: product?.slug || '',
            currentPrice,
            targetPrice: alert.target_price,
            alertType: alert.alert_type || 'target_price',
            priceDrop: ((alert.target_price - currentPrice) / alert.target_price) * 100
          };

          const sent = await this.notificationProvider.send(notification);

          if (sent) {
            triggeredAlertIds.push(alert.id);
            triggeredCount++;
          }
        }
      } catch (err) {
        console.error(`[AlertService] Error evaluating alert ${alert.id}:`, err);
      }
    }

    // 2. Batch update triggered alerts
    if (triggeredAlertIds.length > 0) {
      await supabase
        .from('price_alerts')
        .update({
          is_triggered: true,
          last_triggered_at: new Date().toISOString()
        })
        .in('id', triggeredAlertIds);
    }

    return { triggered: triggeredCount, total: activeAlerts.length };
  }

  // ─── YARDIMCI FONKSİYONLAR ──────────────────────────────

  private async getCurrentLowestPrice(productId: string): Promise<number | null> {
    const { data } = await supabase
      .from('product_prices')
      .select('price')
      .eq('product_id', productId)
      .order('price', { ascending: true })
      .limit(1)
      .single();

    return data?.price || null;
  }

  private async getHistoricalLowest(productId: string, days: number): Promise<number | null> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await supabase
      .from('price_history')
      .select('price')
      .eq('product_id', productId)
      .gte('date', since.toISOString())
      .order('price', { ascending: true })
      .limit(1)
      .single();

    return data?.price || null;
  }

  private async getAiRecommendation(productId: string) {
    const currentPrice = await this.getCurrentLowestPrice(productId);
    if (!currentPrice) return null;

    const { data: history } = await supabase
      .from('price_history')
      .select('price, date')
      .eq('product_id', productId)
      .order('date', { ascending: false })
      .limit(90);

    if (!history || history.length < 5) return null;

    return calculateAiPriceTarget(history, currentPrice);
  }
}
