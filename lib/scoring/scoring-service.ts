/**
 * Piinti Price/Performance Engine - Core Scoring Service
 * 
 * Tüm hesaplamalar bu dosyada yapılır. UI ve diğer modüller
 * sadece ProductScore çıktısını tüketir.
 */
import { supabase } from '@/lib/supabase';
import { ProductScore, ScoringInput, SCORING_ENGINE_VERSION } from './types';
import { assignBadges } from './badge-engine';

export class ScoringService {

  /**
   * Bir ürünün tam skorunu hesaplar.
   */
  async scoreProduct(productId: string): Promise<ProductScore> {
    const input = await this.gatherScoringInput(productId);
    return this.calculate(input);
  }

  /**
   * Birden fazla ürünü skorlar (Kategori/Marka sayfaları için).
   */
  async scoreProducts(productIds: string[]): Promise<ProductScore[]> {
    const results: ProductScore[] = [];
    for (const id of productIds) {
      try {
        results.push(await this.scoreProduct(id));
      } catch {
        // Skorlanamayan ürünü atla
      }
    }
    return results;
  }

  // ─── ANA HESAPLAMA MOTORU ────────────────────────────────
  private calculate(input: ScoringInput): ProductScore {
    const priceScore = this.calcPriceScore(input);
    const valueScore = this.calcValueScore(input);
    const featureScore = this.calcFeatureScore(input);
    const trendScore = this.calcTrendScore(input);

    // Fiyat/Performans = Fiyat ve Özellik Dengesi
    const pricePerformanceScore = Math.round(
      priceScore * 0.35 +
      featureScore * 0.35 +
      valueScore * 0.20 +
      trendScore * 0.10
    );

    // Genel Skor = Tüm skorların ağırlıklı ortalaması
    const overallScore = Math.round(
      priceScore * 0.25 +
      featureScore * 0.30 +
      valueScore * 0.20 +
      trendScore * 0.15 +
      pricePerformanceScore * 0.10
    );

    const scores = { pricePerformanceScore, overallScore, valueScore, priceScore, featureScore, trendScore };
    const badges = assignBadges(scores, input);

    // Güven Seviyesi
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (input.dataPointCount >= 30 && input.reviewsCount >= 5) confidence = 'high';
    else if (input.dataPointCount < 5) confidence = 'low';

    // Açıklama metni
    const reasoning = this.generateReasoning(scores, input, badges);

    return {
      productId: input.productId,
      pricePerformanceScore,
      overallScore,
      valueScore,
      priceScore,
      featureScore,
      trendScore,
      badges,
      reasoning,
      version: SCORING_ENGINE_VERSION,
      generatedAt: new Date().toISOString(),
      confidence,
      dataPointsUsed: input.dataPointCount,
    };
  }

  // ─── ALT SKOR HESAPLAMALARI ──────────────────────────────

  /**
   * Fiyat Skoru (0-100): Düşük fiyat = yüksek skor.
   * Mevcut fiyatın segment ortalamasına ve rakiplere göre konumu.
   */
  private calcPriceScore(input: ScoringInput): number {
    if (input.currentPrice <= 0 || input.segmentAvgPrice <= 0) return 50;

    // Fiyatın segment ortalamasına oranı (1.0 = ortalamada, 0.5 = yarı fiyatına)
    const ratio = input.currentPrice / input.segmentAvgPrice;

    // Oranı skora dönüştür: 0.5 ratio → 100, 1.0 → 50, 1.5 → 15, 2.0 → 0
    let score = Math.round(100 - (ratio - 0.5) * 100);
    
    // Rakiplerle kıyaslama bonusu
    if (input.competitorPrices.length > 0) {
      const cheaperThanCount = input.competitorPrices.filter(p => input.currentPrice < p).length;
      const competitorBonus = (cheaperThanCount / input.competitorPrices.length) * 15;
      score += competitorBonus;
    }

    return this.clamp(score);
  }

  /**
   * Değer Skoru (0-100): Fiyatın kendi geçmişine göre konumu.
   * Dip seviyeye yakınsa = yüksek değer.
   */
  private calcValueScore(input: ScoringInput): number {
    if (!input.minPrice90d || !input.maxPrice90d || input.maxPrice90d === input.minPrice90d) return 50;

    // Fiyatın 90 günlük aralıktaki pozisyonu (0 = dip, 1 = zirve)
    const position = (input.currentPrice - input.minPrice90d) / (input.maxPrice90d - input.minPrice90d);

    // Dip = 100, zirve = 0
    let score = Math.round((1 - position) * 100);

    // Ortalama fiyatla karşılaştır
    if (input.averagePrice > 0 && input.currentPrice < input.averagePrice) {
      const belowAvgPercent = ((input.averagePrice - input.currentPrice) / input.averagePrice) * 100;
      score += Math.min(belowAvgPercent * 0.5, 15); // Max 15 bonus
    }

    return this.clamp(score);
  }

  /**
   * Özellik/Kalite Skoru (0-100): Kullanıcı puanı ve yorum sayısı bazlı.
   */
  private calcFeatureScore(input: ScoringInput): number {
    let score = 50; // Baz

    // Kullanıcı puanı (max 5)
    if (input.rating && input.rating > 0) {
      // 5/5 = 60 puan, 4/5 = 48, 3/5 = 36
      score = Math.round((input.rating / 5) * 60);
    }

    // Yorum sayısı bonusu (güvenilirlik)
    if (input.reviewsCount > 0) {
      // 100+ yorum = +30, 50+ = +25, 10+ = +15, 1+ = +5
      if (input.reviewsCount >= 100) score += 30;
      else if (input.reviewsCount >= 50) score += 25;
      else if (input.reviewsCount >= 10) score += 15;
      else score += 5;

      // Yüksek puan + çok yorum = ekstra güven
      if ((input.rating || 0) >= 4.5 && input.reviewsCount >= 20) score += 10;
    }

    return this.clamp(score);
  }

  /**
   * Trend Skoru (0-100): Fiyat düşüş trendi = yüksek skor.
   */
  private calcTrendScore(input: ScoringInput): number {
    if (input.priceHistory.length < 3) return 50; // Nötr

    const prices = input.priceHistory.map(h => h.price);
    const recentPrices = prices.slice(0, Math.min(7, prices.length));  // Son 7 kayıt
    const olderPrices = prices.slice(Math.min(7, prices.length));      // Daha eski kayıtlar

    if (recentPrices.length === 0 || olderPrices.length === 0) return 50;

    const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;

    if (olderAvg === 0) return 50;

    // Yüzdesel değişim (negatif = düşüş = iyi)
    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

    // -%20 düşüş → 100, %0 değişim → 50, %+20 artış → 0
    let score = Math.round(50 - changePercent * 2.5);

    // 30 günlük dip kontrolü
    if (input.minPrice30d && input.currentPrice <= input.minPrice30d * 1.02) {
      score += 15; // 30 gün dibi bonusu
    }

    return this.clamp(score);
  }

  // ─── AÇIKLAMA ÜRETİMİ ───────────────────────────────────
  private generateReasoning(
    scores: { pricePerformanceScore: number; overallScore: number; valueScore: number; priceScore: number; featureScore: number; trendScore: number },
    input: ScoringInput,
    badges: any[]
  ): string {
    const parts: string[] = [];

    // Fiyat pozisyonu
    if (scores.priceScore >= 75) {
      parts.push(`Bu ürün segment ortalamasının altında fiyatlandırılmış (Fiyat Skoru: ${scores.priceScore}/100).`);
    } else if (scores.priceScore <= 35) {
      parts.push(`Ürünün fiyatı segment ortalamasının üzerinde seyrediyor (Fiyat Skoru: ${scores.priceScore}/100).`);
    }

    // Değer
    if (scores.valueScore >= 75) {
      parts.push(`Son 90 günlük en düşük seviyelerine yakın; alım fırsatı olabilir.`);
    }

    // Trend
    if (scores.trendScore >= 75) {
      parts.push(`Fiyatı son dönemde düşüş trendinde.`);
    } else if (scores.trendScore <= 30) {
      parts.push(`Fiyat son dönemde yükseliş trendinde; beklemek mantıklı olabilir.`);
    }

    // Özellikler
    if (input.rating && input.rating >= 4) {
      parts.push(`${input.rating}/5 puan ve ${input.reviewsCount} yorumla kullanıcı memnuniyeti yüksek.`);
    }

    // Rozetler
    if (badges.length > 0) {
      parts.push(`Rozetler: ${badges.map(b => `${b.emoji} ${b.label}`).join(', ')}.`);
    }

    return parts.join(' ') || 'Bu ürün için yeterli veri ile genel bir değerlendirme yapıldı.';
  }

  // ─── VERİ TOPLAMA ───────────────────────────────────────
  private async gatherScoringInput(productId: string): Promise<ScoringInput> {
    // Ürün bilgileri ve fiyatları
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id, rating, reviews_count, category_id,
        product_prices (price),
        price_history (price, date)
      `)
      .eq('id', productId)
      .single();

    if (error || !product) throw new Error(`Product ${productId} not found for scoring`);

    const prices = ((product.product_prices || []) as any[]).map(p => p.price).filter((p: number) => p > 0);
    const currentPrice = prices.length > 0 ? Math.min(...prices) : 0;

    const history = ((product.price_history || []) as any[])
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const historyPrices = history.map((h: any) => h.price);
    const averagePrice = historyPrices.length > 0
      ? historyPrices.reduce((a: number, b: number) => a + b, 0) / historyPrices.length
      : currentPrice;

    // Zaman dilimlerine göre min/max
    const now = Date.now();
    const d30 = history.filter((h: any) => now - new Date(h.date).getTime() < 30 * 86400000);
    const d90 = history.filter((h: any) => now - new Date(h.date).getTime() < 90 * 86400000);

    const d30Prices = d30.map((h: any) => h.price);
    const d90Prices = d90.map((h: any) => h.price);

    // Rakip ürün fiyatları (aynı kategori)
    let competitorPrices: number[] = [];
    let segmentAvgPrice = currentPrice;

    if (product.category_id) {
      const { data: competitors } = await supabase
        .from('products')
        .select('product_prices(price)')
        .eq('category_id', product.category_id)
        .neq('id', productId)
        .limit(20);

      if (competitors) {
        competitorPrices = competitors
          .flatMap((c: any) => (c.product_prices || []).map((p: any) => p.price))
          .filter((p: number) => p > 0);

        if (competitorPrices.length > 0) {
          segmentAvgPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
        }
      }
    }

    return {
      productId,
      currentPrice,
      averagePrice,
      minPrice30d: d30Prices.length > 0 ? Math.min(...d30Prices) : null,
      maxPrice30d: d30Prices.length > 0 ? Math.max(...d30Prices) : null,
      minPrice90d: d90Prices.length > 0 ? Math.min(...d90Prices) : null,
      maxPrice90d: d90Prices.length > 0 ? Math.max(...d90Prices) : null,
      priceHistory: history.slice(0, 30),
      rating: product.rating,
      reviewsCount: product.reviews_count || 0,
      competitorPrices,
      segmentAvgPrice,
      dataPointCount: history.length + prices.length,
    };
  }

  // ─── YARDIMCI ───────────────────────────────────────────
  private clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(value)));
  }
}
