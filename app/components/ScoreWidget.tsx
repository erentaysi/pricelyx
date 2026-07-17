'use client';

import { useState, useEffect } from 'react';
import { Award, TrendingUp, Zap, BarChart3 } from 'lucide-react';

interface ProductScoreData {
  pricePerformanceScore: number;
  overallScore: number;
  valueScore: number;
  priceScore: number;
  featureScore: number;
  trendScore: number;
  badges: { type: string; label: string; emoji: string; color: string; reason: string }[];
  reasoning: string;
  confidence: string;
}

interface Props {
  productId: string;
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">{icon} {label}</div>
        <span className="text-xs font-black text-slate-700">{score}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function ScoreWidget({ productId }: Props) {
  const [data, setData] = useState<ProductScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScore() {
      try {
        const res = await fetch(`/api/scoring?productId=${productId}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json.score);
      } catch { /* sessizce devam */ }
      finally { setLoading(false); }
    }
    if (productId) fetchScore();
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse h-48 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Award className="w-6 h-6 text-slate-300" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Skor Hesaplanıyor...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Piinti Skor</h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              Fiyat/Performans Analizi
            </p>
          </div>
        </div>

        {/* Ana Skor */}
        <div className="text-right">
          <div className="text-3xl font-black text-slate-900 leading-none">{data.pricePerformanceScore}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/100</div>
        </div>
      </div>

      {/* Rozetler */}
      {data.badges.length > 0 && (
        <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2">
          {data.badges.map((badge, idx) => (
            <span
              key={idx}
              title={badge.reason}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider ${badge.color} shadow-sm cursor-help`}
            >
              {badge.emoji} {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Skor Çubukları */}
      <div className="p-6 pt-3 space-y-3">
        <ScoreBar label="Fiyat" score={data.priceScore} icon={<Zap className="w-3 h-3" />} />
        <ScoreBar label="Değer" score={data.valueScore} icon={<TrendingUp className="w-3 h-3" />} />
        <ScoreBar label="Kalite" score={data.featureScore} icon={<Award className="w-3 h-3" />} />
        <ScoreBar label="Trend" score={data.trendScore} icon={<BarChart3 className="w-3 h-3" />} />
      </div>

      {/* Açıklama */}
      <div className="px-6 pb-6">
        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
          {data.reasoning}
        </p>
      </div>
    </div>
  );
}
