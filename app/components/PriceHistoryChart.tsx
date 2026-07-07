'use client';

/**
 * PriceHistoryChart — Gelişmiş fiyat geçmişi grafiği.
 *
 * Özellikler:
 *  - Son 6 aylık veri penceresi (varsayılan; prop ile değiştirilebilir)
 *  - "Son 30 günün en düşüğü" referans çizgisi (kırmızı noktalı)
 *  - Gradient area dolgusu
 *  - Gelişmiş tooltip: tarih + fiyat + satıcı adı
 *  - Minimum 2 veri noktası yoksa bilgilendirici boş durum
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface HistoryItem {
  id?: number;
  price: number;
  recorded_at: string;
  vendors?: { name: string; color?: string };
}

interface ChartDataPoint {
  date: string;           // Gösterim etiketi
  rawDate: Date;          // Sıralama için
  fiyat: number;
  satici: string;
  fullDate: string;       // Tooltip'te tam tarih
}

interface Props {
  historyData: HistoryItem[];
  productName?: string;
  /** Kaç günlük pencere gösterilsin? Varsayılan: 180 (6 ay) */
  windowDays?: number;
  /** Son 30 günlük referans çizgisi gösterilsin mi? Varsayılan: true */
  showReferenceMin?: boolean;
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

function trPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(price));
}

function formatLabel(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

// ─── Özel Tooltip ─────────────────────────────────────────────────────────────

// Recharts TooltipProps.payload tip tanımı sürümler arasında değişkenlik gösterdiğinden
// özel bir arayüz kullanıyoruz.
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;

  return (
    <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-4 min-w-[160px]">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
        {point.fullDate}
      </p>
      <p className="text-2xl font-black text-slate-900 tabular-nums">
        {trPrice(point.fiyat)} <span className="text-base">₺</span>
      </p>
      {point.satici && point.satici !== 'Sistem' && (
        <p className="text-xs font-bold text-slate-500 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
          {point.satici}
        </p>
      )}
    </div>
  );
}

// ─── Boş Durum ────────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="w-full h-48 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8">
      <TrendingUp className="w-10 h-10 mb-4 opacity-20" />
      <p className="text-sm font-bold px-4 text-center max-w-xs leading-relaxed uppercase tracking-widest opacity-40">
        Fiyat geçmişi toplanıyor. Fiyat değiştikçe bu grafik canlanacak.
      </p>
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function PriceHistoryChart({
  historyData,
  productName,
  windowDays = 180,
  showReferenceMin = true,
}: Props) {
  const { chartData, refMin30 } = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return { chartData: [], refMin30: null };
    }

    const now = new Date();
    const cutoff = subDays(now, windowDays);

    // Pencereyi filtrele ve sırala
    const filtered = historyData
      .filter((h) => new Date(h.recorded_at) >= cutoff)
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );

    // Eğer pencerede yeterli veri yoksa tüm geçmişi kullan
    const source = filtered.length >= 2 ? filtered : [...historyData].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const mapped: ChartDataPoint[] = source.map((item) => {
      const d = new Date(item.recorded_at);
      return {
        date: formatLabel(d),
        rawDate: d,
        fiyat: item.price,
        satici: item.vendors?.name || 'Sistem',
        fullDate: formatFullDate(d),
      };
    });

    // Son 30 günün en düşüğü referans değeri
    let refMin: number | null = null;
    if (showReferenceMin) {
      const cutoff30 = subDays(now, 30);
      const last30 = source.filter((h) => new Date(h.recorded_at) >= cutoff30);
      if (last30.length > 0) {
        refMin = Math.min(...last30.map((h) => h.price));
      }
    }

    return { chartData: mapped, refMin30: refMin };
  }, [historyData, windowDays, showReferenceMin]);

  if (chartData.length < 2) return <EmptyChart />;

  const prices = chartData.map((d) => d.fiyat);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = Math.max((maxPrice - minPrice) * 0.15, minPrice * 0.05, 50);

  return (
    <div
      className="w-full h-72 mt-4"
      role="img"
      aria-label={`${productName || 'Ürün'} son ${windowDays} günlük fiyat değişim grafiği`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Ana gradient dolgu */}
            <linearGradient id="priceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.25} />
              <stop offset="85%" stopColor="#14b8a6" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
            dy={10}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[Math.max(0, minPrice - padding), maxPrice + padding]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
            tickFormatter={(v) => `${trPrice(v)} ₺`}
            dx={-8}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Referans çizgisi: Son 30 günün en düşüğü */}
          {refMin30 !== null && (
            <ReferenceLine
              y={refMin30}
              stroke="#f43f5e"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{
                value: `30g min: ${trPrice(refMin30)} ₺`,
                position: 'insideTopRight',
                fill: '#f43f5e',
                fontSize: 10,
                fontWeight: 700,
                dy: -6,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="fiyat"
            stroke="#14b8a6"
            strokeWidth={2.5}
            fill="url(#priceAreaGrad)"
            dot={false}
            activeDot={{
              r: 5,
              fill: '#0d9488',
              stroke: '#fff',
              strokeWidth: 2,
            }}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
