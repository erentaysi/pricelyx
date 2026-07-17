/**
 * Piinti Price/Performance Engine - Type Definitions
 * Skorlama, rozetleme ve versiyonlama veri yapıları.
 */

// ─── Skor Çıktısı ────────────────────────────────────────
export interface ProductScore {
  productId: string;
  
  // Ana Skorlar (0-100)
  pricePerformanceScore: number;  // Fiyat/Performans ana skoru
  overallScore: number;           // Genel skor (tüm alt skorların ağırlıklı ortalaması)
  valueScore: number;             // Değer skoru (fiyatın piyasaya göre konumu)
  priceScore: number;             // Fiyat skoru (düşük fiyat = yüksek skor)
  featureScore: number;           // Özellik/Kalite skoru (puan + yorum)
  trendScore: number;             // Trend skoru (fiyat hareketi yönü)

  // Rozetler
  badges: ProductBadge[];

  // Açıklama
  reasoning: string;

  // Metadata
  version: string;
  generatedAt: string;
  confidence: 'high' | 'medium' | 'low';
  dataPointsUsed: number;
}

// ─── Rozet Tanımları ──────────────────────────────────────
export type BadgeType =
  | 'price_performance_champion'  // 🥇 Fiyat/Performans Şampiyonu
  | 'editor_pick'                 // ⭐ Editör Önerisi
  | 'most_popular'                // 🔥 En Çok Tercih Edilen
  | 'best_price'                  // 💰 En Uygun Fiyat
  | 'rising_star'                 // 🚀 Yükselen Ürün
  | 'premium_choice';             // 🏆 Premium Tercih

export interface ProductBadge {
  type: BadgeType;
  label: string;
  emoji: string;
  color: string;       // Tailwind renk sınıfı
  reason: string;      // Neden bu rozet verildi
}

// ─── Rozet Kuralları (Merkezi Yönetim) ────────────────────
export const BADGE_DEFINITIONS: Record<BadgeType, Omit<ProductBadge, 'reason'>> = {
  price_performance_champion: {
    type: 'price_performance_champion',
    label: 'Fiyat/Performans Şampiyonu',
    emoji: '🥇',
    color: 'bg-amber-500',
  },
  editor_pick: {
    type: 'editor_pick',
    label: 'Editör Önerisi',
    emoji: '⭐',
    color: 'bg-indigo-500',
  },
  most_popular: {
    type: 'most_popular',
    label: 'En Çok Tercih Edilen',
    emoji: '🔥',
    color: 'bg-rose-500',
  },
  best_price: {
    type: 'best_price',
    label: 'En Uygun Fiyat',
    emoji: '💰',
    color: 'bg-emerald-500',
  },
  rising_star: {
    type: 'rising_star',
    label: 'Yükselen Ürün',
    emoji: '🚀',
    color: 'bg-sky-500',
  },
  premium_choice: {
    type: 'premium_choice',
    label: 'Premium Tercih',
    emoji: '🏆',
    color: 'bg-violet-500',
  },
};

// ─── Scoring Engine Versiyonu ─────────────────────────────
export const SCORING_ENGINE_VERSION = '1.0.0';

// ─── Giriş Verisi ────────────────────────────────────────
export interface ScoringInput {
  productId: string;
  currentPrice: number;
  averagePrice: number;        // Fiyat geçmişi ortalaması
  minPrice30d: number | null;  // Son 30 gün minimum
  maxPrice30d: number | null;  // Son 30 gün maksimum
  minPrice90d: number | null;  // Son 90 gün minimum
  maxPrice90d: number | null;
  priceHistory: { price: number; date: string }[];
  rating: number | null;       // 0-5
  reviewsCount: number;
  competitorPrices: number[];  // Aynı kategorideki rakip fiyatları
  segmentAvgPrice: number;     // Segmentteki ortalama fiyat
  dataPointCount: number;      // Toplam veri noktası
}
