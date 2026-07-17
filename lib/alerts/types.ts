/**
 * AI Smart Price Alert - Type Definitions
 * Tüm alarm tipleri, provider arayüzleri ve veri yapıları.
 */

// ─── Alarm Tipleri ────────────────────────────────────────
export type AlertType =
  | 'target_price'        // Kullanıcının belirlediği sabit hedef fiyat
  | 'percentage_drop'     // Yüzdesel düşüş (Örn: %15 düşünce bildir)
  | 'lowest_30d'          // Son 30 günün en düşüğüne inince bildir
  | 'lowest_90d'          // Son 90 günün en düşüğüne inince bildir
  | 'ai_recommended';     // AI'ın fiyat geçmişine göre önerdiği hedef fiyat

// ─── Alarm Verisi ─────────────────────────────────────────
export interface PriceAlert {
  id?: string;
  product_id: string;
  user_id?: string | null;
  email: string;
  alert_type: AlertType;
  target_price: number;          // Tüm tiplerde hesaplanmış nihai hedef fiyat
  percentage_threshold?: number; // Sadece 'percentage_drop' tipinde kullanılır
  is_active: boolean;
  is_triggered: boolean;         // Duplicate bildirim koruması
  last_triggered_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ─── Bildirim İçeriği ─────────────────────────────────────
export interface AlertNotification {
  alertId: string;
  email: string;
  productTitle: string;
  productSlug: string;
  currentPrice: number;
  targetPrice: number;
  alertType: AlertType;
  priceDrop: number; // Yüzdesel düşüş (Örn: 15.4)
}

// ─── Bildirim Sağlayıcı Arayüzü (Provider Interface) ─────
export interface INotificationProvider {
  /**
   * Bildirim gönderir. İleride E-posta, Telegram, Push vb. için
   * ayrı implementasyonlar yazılabilir.
   */
  send(notification: AlertNotification): Promise<boolean>;
}

// ─── AI Fiyat Önerisi Çıktısı ─────────────────────────────
export interface AiPriceRecommendation {
  recommendedPrice: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  basedOnDays: number;  // Kaç günlük veriye dayanıyor
}

// ─── Alert Evaluation Result ──────────────────────────────
export interface AlertEvaluation {
  shouldTrigger: boolean;
  currentPrice: number;
  targetPrice: number;
  message: string;
}
