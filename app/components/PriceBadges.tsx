'use client';

/**
 * PriceBadges — Dinamik, price_history verisiyle hesaplanan ikna edici rozetler.
 *
 * Rozetler tamamen gerçek veriden üretilir:
 *  1. LowestInDaysBadge  — Son X günün en düşük fiyatı mı?
 *  2. PriceDropBadge     — Son 7 gün içinde fiyat düştü mü?
 *  3. UnitPriceBadge     — Birim fiyat (isteğe bağlı, prop ile aktarılır)
 */

import { useMemo } from 'react';
import { BellRing, TrendingDown, Tag, Award } from 'lucide-react';

// ─── Tip Tanımları ─────────────────────────────────────────────────────────────

export interface PriceHistoryPoint {
  price: number;
  recorded_at: string;
}

export interface PriceBadgesProps {
  /** Ürünün tüm fiyat geçmişi (Supabase'den gelen price_history dizisi) */
  priceHistory: PriceHistoryPoint[];
  /** Şu anki en düşük fiyat (product_prices'tan) */
  currentPrice: number;
  /**
   * Birim fiyat bilgisi — isteğe bağlı.
   * Örn: { value: 85.82, unit: 'kg' } ya da { label: 'Adetli Al Az Öde' }
   */
  unitPrice?: { value?: number; unit?: string; label?: string };
  /** Kaç günlük pencerede en ucuz bakılsın? Varsayılan: 30 */
  windowDays?: number;
}

// ─── Yardımcı Fonksiyonlar ─────────────────────────────────────────────────────

function trPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

// ─── Alt Bileşenler ────────────────────────────────────────────────────────────

/**
 * "Son 30 günün en ucuzu — Kazancın 450,00 ₺" rozeti.
 * Sadece price_history'de gerçekten en düşük fiyatsa gösterilir.
 */
function LowestInDaysBadge({
  history,
  currentPrice,
  windowDays,
}: {
  history: PriceHistoryPoint[];
  currentPrice: number;
  windowDays: number;
}) {
  const result = useMemo(() => {
    if (!history || history.length < 2 || currentPrice <= 0) return null;

    const cutoff = subDays(new Date(), windowDays);
    const windowPrices = history
      .filter((h) => new Date(h.recorded_at) >= cutoff)
      .map((h) => h.price);

    if (windowPrices.length === 0) return null;

    const windowMin = Math.min(...windowPrices);
    const windowMax = Math.max(...windowPrices);

    // Mevcut fiyat bu penceredeki en düşük mü veya buna çok yakın mı? (%2 tolerans)
    if (currentPrice > windowMin * 1.02) return null;

    const savings = windowMax - currentPrice;
    return { savings, windowMin, windowMax };
  }, [history, currentPrice, windowDays]);

  if (!result) return null;

  return (
    <div
      role="status"
      aria-label={`Son ${windowDays} günün en düşük fiyatı`}
      className="
        inline-flex items-center gap-2
        bg-gradient-to-r from-emerald-500 to-teal-500
        text-white text-xs font-black px-4 py-2 rounded-full
        shadow-lg shadow-emerald-500/30
        animate-[fadeSlideIn_0.4s_ease-out]
        select-none
      "
    >
      <Award className="w-3.5 h-3.5 shrink-0" />
      <span>
        Son {windowDays} günün en ucuzu
        {result.savings > 1 && (
          <span className="ml-1 font-black opacity-90">
            — Kazancın{' '}
            <span className="underline underline-offset-2">
              {trPrice(result.savings)} ₺
            </span>
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * Son 7 gün içinde fiyat düşüşü olduysa animasyonlu çan ikonu.
 */
function PriceDropBadge({
  history,
  currentPrice,
}: {
  history: PriceHistoryPoint[];
  currentPrice: number;
}) {
  const dropped = useMemo(() => {
    if (!history || history.length < 2 || currentPrice <= 0) return null;

    const cutoff = subDays(new Date(), 7);
    const recentHistory = [...history]
      .filter((h) => new Date(h.recorded_at) >= cutoff)
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );

    if (recentHistory.length < 2) return null;

    const firstPrice = recentHistory[0].price;
    const dropAmount = firstPrice - currentPrice;

    // En az %2 düşüş ve 10 ₺'den fazla olmalı
    if (dropAmount < firstPrice * 0.02 || dropAmount < 10) return null;

    const dropPercent = Math.round((dropAmount / firstPrice) * 100);
    return { dropAmount, dropPercent };
  }, [history, currentPrice]);

  if (!dropped) return null;

  return (
    <div
      role="status"
      aria-label={`Fiyat son 7 günde %${dropped.dropPercent} düştü`}
      className="
        inline-flex items-center gap-2
        bg-gradient-to-r from-blue-500 to-indigo-500
        text-white text-xs font-black px-4 py-2 rounded-full
        shadow-lg shadow-blue-500/30
        animate-[fadeSlideIn_0.5s_ease-out]
        select-none
      "
    >
      <BellRing className="w-3.5 h-3.5 shrink-0 animate-[ring_1.5s_ease-in-out_infinite]" />
      <span className="flex items-center gap-1.5">
        <TrendingDown className="w-3 h-3" />
        Fiyatı Düştü! %{dropped.dropPercent} ↓{' '}
        <span className="opacity-90">({trPrice(dropped.dropAmount)} ₺ indirim)</span>
      </span>
    </div>
  );
}

/**
 * Birim fiyat rozeti — Sadece prop geçilirse gösterilir.
 * Örn: süpermarket, kozmetik ürünleri için.
 */
function UnitPriceBadge({
  unitPrice,
}: {
  unitPrice: NonNullable<PriceBadgesProps['unitPrice']>;
}) {
  const label = unitPrice.label
    ? unitPrice.label
    : unitPrice.value && unitPrice.unit
    ? `${trPrice(unitPrice.value)} ₺/${unitPrice.unit}`
    : null;

  if (!label) return null;

  return (
    <div
      role="note"
      aria-label={`Birim fiyat: ${label}`}
      className="
        inline-flex items-center gap-1.5
        bg-amber-50 border border-amber-200 text-amber-700
        text-xs font-black px-3 py-1.5 rounded-full
        select-none
      "
    >
      <Tag className="w-3.5 h-3.5 shrink-0" />
      {label}
    </div>
  );
}

// ─── Ana Dışa Aktarılan Bileşen ────────────────────────────────────────────────

/**
 * PriceBadges — Tüm rozetleri tek noktadan render eder.
 * Boş veri veya eşik altında kalan durumlarda hiçbir şey göstermez.
 *
 * Kullanım:
 * ```tsx
 * <PriceBadges
 *   priceHistory={product.price_history}
 *   currentPrice={lowestPrice}
 *   windowDays={30}
 *   unitPrice={{ value: 85.82, unit: 'kg' }}
 * />
 * ```
 */
export default function PriceBadges({
  priceHistory,
  currentPrice,
  unitPrice,
  windowDays = 30,
}: PriceBadgesProps) {
  if (!priceHistory || currentPrice <= 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 my-3"
      aria-label="Fiyat rozetleri"
    >
      <LowestInDaysBadge
        history={priceHistory}
        currentPrice={currentPrice}
        windowDays={windowDays}
      />
      <PriceDropBadge history={priceHistory} currentPrice={currentPrice} />
      {unitPrice && <UnitPriceBadge unitPrice={unitPrice} />}
    </div>
  );
}
