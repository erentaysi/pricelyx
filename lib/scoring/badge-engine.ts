/**
 * Piinti Price/Performance Engine - Badge Assignment Logic
 * 
 * Merkezi rozet kuralları. Hangi skor eşiklerinde hangi rozet verilir?
 * Bu dosyayı değiştirerek tüm rozetlemeyi tek noktadan kontrol edebilirsiniz.
 */
import { ProductBadge, BadgeType, BADGE_DEFINITIONS, ScoringInput } from './types';

interface ScoreSet {
  pricePerformanceScore: number;
  overallScore: number;
  valueScore: number;
  priceScore: number;
  featureScore: number;
  trendScore: number;
}

export function assignBadges(scores: ScoreSet, input: ScoringInput): ProductBadge[] {
  const badges: ProductBadge[] = [];

  // 🥇 Fiyat/Performans Şampiyonu: F/P skoru 85+ VE feature skoru 60+
  if (scores.pricePerformanceScore >= 85 && scores.featureScore >= 60) {
    badges.push({
      ...BADGE_DEFINITIONS.price_performance_champion,
      reason: `F/P skoru ${scores.pricePerformanceScore}/100 ile kategorisinin en iyileri arasında.`
    });
  }

  // ⭐ Editör Önerisi: Overall 80+ VE yeterli yorum (>10) VE iyi puan (4+)
  if (scores.overallScore >= 80 && input.reviewsCount >= 10 && (input.rating || 0) >= 4) {
    badges.push({
      ...BADGE_DEFINITIONS.editor_pick,
      reason: `${input.rating}/5 puan ve ${input.reviewsCount} yorum ile üstün genel değerlendirme.`
    });
  }

  // 🔥 En Çok Tercih Edilen: Yorum sayısı 50+ VE puan 3.5+
  if (input.reviewsCount >= 50 && (input.rating || 0) >= 3.5) {
    badges.push({
      ...BADGE_DEFINITIONS.most_popular,
      reason: `${input.reviewsCount} kullanıcı yorumuyla kategorisinin en popüler ürünü.`
    });
  }

  // 💰 En Uygun Fiyat: Price skoru 90+ (segment ortalamasının çok altında)
  if (scores.priceScore >= 90) {
    badges.push({
      ...BADGE_DEFINITIONS.best_price,
      reason: `Mevcut fiyatı segmentindeki ortalamanın çok altında.`
    });
  }

  // 🚀 Yükselen Ürün: Trend skoru 80+ (fiyat düşüşte + popülerlik artışta)
  if (scores.trendScore >= 80) {
    badges.push({
      ...BADGE_DEFINITIONS.rising_star,
      reason: `Fiyatı son dönemde belirgin şekilde düşüşte; alım fırsatı oluşuyor.`
    });
  }

  // 🏆 Premium Tercih: Feature 90+ VE puan 4.5+ (pahalı ama değer)
  if (scores.featureScore >= 90 && (input.rating || 0) >= 4.5) {
    badges.push({
      ...BADGE_DEFINITIONS.premium_choice,
      reason: `${input.rating}/5 puanla üstün kalite ve kullanıcı memnuniyeti.`
    });
  }

  return badges;
}
