"use client";

/**
 * ReviewSummary — Gerçek yorum modülü.
 *
 * Kurallar (yasal + etik):
 *  - Yorum YOKSA: net, dürüst "henüz yorum yapılmadı" boş durumu gösterilir.
 *  - Yorum VARSA: gerçek veriler gösterilir, kullanıcı adı kısmen maskelenir
 *    (gizlilik için, yanıltma amacıyla değil).
 *  - Hiçbir şekilde sahte, seed-based veya uydurma yorum üretilmez.
 *
 * Props:
 *  - productId: string  → AI özet endpoint'i için
 *  - reviews: Review[]  → Supabase'den çekilen gerçek yorumlar (server component tarafından geçilir)
 */

import { useState, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  MessageSquare,
  Star,
  Plus,
  Minus,
  BarChart2,
  MessageCircleOff,
  User,
} from "lucide-react";

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface Review {
  id: number | string;
  user_name: string;
  rating: number;          // 1–5
  comment: string;
  created_at: string;
}

interface ReviewSummaryProps {
  productId: string;
  reviews: Review[];       // Server component'ten gelen gerçek yorum dizisi
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

/**
 * Kullanıcı adını gizlilik için maskeler.
 * Yanıltma amacı yoktur — kullanıcı adları genel pratikte kısaltılarak gösterilir.
 * Örn: "Ahmet Çelik" → "Ah*** Çe***"
 */
function maskName(name: string): string {
  if (!name || name.trim().length === 0) return "K***";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 1) return part + "***";
      if (part.length === 2) return part[0] + "***";
      return part.slice(0, 2) + "***";
    })
    .join(" ");
}

/**
 * Tarih formatlama — Türkçe yerel tarih.
 * Örn: "3 Ocak 2025"
 */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ─── Alt Bileşen: Puan Dağılım Çubuğu ────────────────────────────────────────

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right font-bold text-slate-500">{star}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-slate-400 font-semibold">{count}</span>
    </div>
  );
}

// ─── Alt Bileşen: Tek Yorum Kartı ─────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:bg-white hover:shadow-lg hover:border-slate-200 transition-all duration-300">
      {/* Üst Satır: Avatar + İsim + Puan */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-500 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">
              {maskName(review.user_name)}
            </p>
            {review.created_at && (
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {formatDate(review.created_at)}
              </p>
            )}
          </div>
        </div>
        {/* Yıldızlar */}
        <div className="flex gap-0.5 shrink-0" aria-label={`${review.rating} yıldız`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i <= review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Yorum Metni */}
      <p className="text-sm text-slate-600 leading-relaxed font-medium">
        {review.comment}
      </p>
    </div>
  );
}

// ─── Boş Durum ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
        <MessageCircleOff className="w-8 h-8 text-slate-300" />
      </div>
      <h4 className="font-black text-slate-700 text-base mb-2">
        Henüz yorum yapılmadı
      </h4>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
        Bu ürün için şu an doğrulanmış bir kullanıcı yorumu bulunmuyor.
        Satın aldıktan sonra ilk yorumu sen yapabilirsin.
      </p>
    </div>
  );
}

// ─── AI Özet Paneli ───────────────────────────────────────────────────────────

function AiSummaryPanel({ productId }: { productId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/summarize-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        throw new Error("Özet alınamadı");
      }
    } catch (err) {
      console.error(err);
      setError("AI özet şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (summary) {
    return (
      <div className="mt-6 space-y-4 animate-[fadeSlideIn_0.4s_ease-out]">
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative">
          <div className="absolute -top-3 -left-3 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-slate-700 leading-relaxed font-medium italic text-base">
            &ldquo;{summary}&rdquo;
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <Plus className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-black text-emerald-700 uppercase tracking-tight">
              Kullanıcılar Genel Olarak Memnun
            </span>
          </div>
          <div className="flex items-center gap-3 bg-rose-50 p-4 rounded-xl border border-rose-100">
            <Minus className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-xs font-black text-rose-700 uppercase tracking-tight">
              Dikkat Edilmesi Gereken Detaylar Var
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-bold uppercase tracking-widest animate-pulse">
            Yorumlar Analiz Ediliyor…
          </p>
        </div>
      ) : error ? (
        <p className="text-sm text-rose-500 font-bold text-center bg-rose-50 p-4 rounded-xl border border-rose-100">
          {error}
        </p>
      ) : (
        <button
          onClick={fetchSummary}
          id="ai-summarize-reviews-btn"
          className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2 justify-center"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          Yapay Zeka ile Yorumları Özetle
        </button>
      )}
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function ReviewSummary({ productId, reviews }: ReviewSummaryProps) {
  // Puan dağılımını hesapla
  const { avgRating, distribution, totalCount } = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { avgRating: 0, distribution: {} as Record<number, number>, totalCount: 0 };
    }
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.round(r.rating);
      if (rounded >= 1 && rounded <= 5) dist[rounded]++;
    });
    return { avgRating: sum / total, distribution: dist, totalCount: total };
  }, [reviews]);

  const hasReviews = reviews && reviews.length > 0;

  return (
    <div className="bg-white p-8 rounded-[2rem] mb-10 border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden">
      {/* Üst sol aksan çizgisi */}
      <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-10" />

      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3
            id="reviews-heading"
            className="text-xl font-bold flex items-center gap-3 text-slate-900 leading-none mb-1"
          >
            <MessageSquare className="w-6 h-6 text-primary" />
            Kullanıcı Yorumları
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {hasReviews
              ? `${totalCount} Doğrulanmış Yorum`
              : "Doğrulanmış Yorum Sistemi"}
          </p>
        </div>

        {/* Ortalama Puan — yorum varsa */}
        {hasReviews && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-5 py-3 rounded-2xl shrink-0">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="font-black text-amber-700 text-lg tabular-nums">
              {avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* İçerik */}
      {!hasReviews ? (
        <EmptyState />
      ) : (
        <>
          {/* Puan Dağılım Grafiği */}
          <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Puan Dağılımı
              </span>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  star={star}
                  count={distribution[star] ?? 0}
                  total={totalCount}
                />
              ))}
            </div>
          </div>

          {/* Yorum Kartları */}
          <div
            className="grid md:grid-cols-2 gap-4"
            aria-labelledby="reviews-heading"
          >
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* AI Özet Paneli */}
          <AiSummaryPanel productId={productId} />
        </>
      )}

      {/* Alt not — sadece yorum varsa */}
      {hasReviews && (
        <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center opacity-60">
          Kullanıcı adları gizlilik amacıyla kısmi olarak gösterilmektedir.
        </p>
      )}
    </div>
  );
}
