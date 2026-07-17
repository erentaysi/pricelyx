/**
 * Piinti Price Prediction Engine - Service Layer
 * 
 * Veritabanından (Supabase) geçmiş fiyat verilerini çeker,
 * Prediction Engine'e gönderir ve sonuçları döner/cache'ler.
 */
import { supabase } from '@/lib/supabase';
import { PredictionResult, PredictionInput, MINIMUM_DATA_POINTS } from './types';
import { calculatePrediction } from './prediction-engine';

export class PredictionService {

  /**
   * Bir ürün için fiyat tahmin analizi üretir.
   */
  async getPrediction(productId: string): Promise<PredictionResult> {
    const input = await this.gatherPredictionData(productId);

    if (input.priceHistory.length < MINIMUM_DATA_POINTS) {
      return {
        available: false,
        productId,
        reason: 'İstatistiksel olarak güvenilir bir tahmin üretmek için yeterli fiyat geçmişi bulunmuyor.',
        minimumDataPointsNeeded: MINIMUM_DATA_POINTS,
        currentDataPoints: input.priceHistory.length
      };
    }

    const prediction = calculatePrediction(input);

    if (!prediction) {
      return {
        available: false,
        productId,
        reason: 'Tahmin motoru bu verilerle sonuç üretemedi.',
        minimumDataPointsNeeded: MINIMUM_DATA_POINTS,
        currentDataPoints: input.priceHistory.length
      };
    }

    return {
      available: true,
      prediction
    };
  }

  // ─── VERİ TOPLAMA ───────────────────────────────────────
  
  private async gatherPredictionData(productId: string): Promise<PredictionInput> {
    // 1. Mevcut (güncel) fiyat
    const { data: currentPrices } = await supabase
      .from('product_prices')
      .select('price')
      .eq('product_id', productId)
      .order('price', { ascending: true })
      .limit(1);

    const currentPrice = currentPrices && currentPrices.length > 0 ? currentPrices[0].price : 0;

    // 2. Fiyat Geçmişi (Tüm zamanlar veya max 365 gün çekebiliriz)
    const { data: history } = await supabase
      .from('price_history')
      .select('price, date')
      .eq('product_id', productId)
      .order('date', { ascending: false })
      .limit(180); // Son 6 ayın verisi fazlasıyla yeterli

    // Eğer tarih bazlı kopyalar (aynı günde 2 fiyat) varsa, günlük en düşük fiyata göre tekilleştir (Deduplication)
    const uniqueHistoryMap = new Map<string, number>();
    
    if (history) {
      for (const h of history) {
        // "2026-07-16" formatına çevir
        const dayStr = h.date.split('T')[0];
        if (!uniqueHistoryMap.has(dayStr)) {
          uniqueHistoryMap.set(dayStr, h.price);
        } else {
          // Eğer o gün için daha düşük bir fiyat varsa onu tut
          if (h.price < uniqueHistoryMap.get(dayStr)!) {
            uniqueHistoryMap.set(dayStr, h.price);
          }
        }
      }
    }

    const cleanedHistory = Array.from(uniqueHistoryMap.entries()).map(([dateStr, price]) => ({
      date: new Date(dateStr).toISOString(),
      price
    }));

    // Mevcut fiyatı da bugünün tarihi ile geçmişe ekle ki algoritma tam entegre çalışsın
    if (currentPrice > 0) {
      cleanedHistory.push({
        date: new Date().toISOString(),
        price: currentPrice
      });
    }

    return {
      productId,
      currentPrice: currentPrice || (cleanedHistory.length > 0 ? cleanedHistory[0].price : 0),
      priceHistory: cleanedHistory
    };
  }
}
