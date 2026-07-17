'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, ThumbsUp, AlertTriangle } from 'lucide-react';
import { AiCoachAnalysis } from '@/lib/ai/provider';

interface AiCoachWidgetProps {
  productId: string;
}

export default function AiCoachWidget({ productId }: AiCoachWidgetProps) {
  const [analysis, setAnalysis] = useState<AiCoachAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAiAnalysis() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch('/api/ai-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });

        if (!res.ok) {
          throw new Error('AI Coach verisi alınamadı.');
        }

        const data = await res.json();
        setAnalysis(data.analysis);
      } catch (err: any) {
        setError(err.message || 'Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchAiAnalysis();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-3xl p-6 mb-8 border border-indigo-100 animate-pulse flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">AI Coach Analiz Ediyor...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-slate-400" />
        <span className="text-sm font-medium text-slate-500">AI Analizi şu an kullanılamıyor.</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-8 mb-12 text-white shadow-2xl relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight">Piinti AI Coach</h2>
          <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Yapay Zeka Satın Alma Analizi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* Sol Sütun: Özet & Aksiyon */}
        <div className="space-y-6">
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <h3 className="text-sm text-slate-400 mb-2 uppercase tracking-widest font-bold">Özet Değerlendirme</h3>
            <p className="text-slate-200 text-sm leading-relaxed">{analysis.buyAdvice}</p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex-1">
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">F/P Skoru</span>
              <div className="text-3xl font-black text-white">{analysis.pricePerformanceScore}<span className="text-lg text-slate-500">/10</span></div>
            </div>
            <div className={`rounded-2xl p-5 flex-1 flex items-center justify-center gap-2 border ${analysis.isWorthBuyingNow ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              {analysis.isWorthBuyingNow ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
              <span className="font-bold">{analysis.isWorthBuyingNow ? 'Alım Fırsatı' : 'Bekle'}</span>
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Artılar Eksiler & Alternatifler */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-3">
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Artılar</h4>
              </div>
              <ul className="space-y-2">
                {analysis.pros.slice(0,3).map((p, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-rose-500/5 rounded-2xl p-4 border border-rose-500/10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest">Eksiler</h4>
              </div>
              <ul className="space-y-2">
                {analysis.cons.slice(0,3).map((c, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-rose-500 mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Daha İyi Alternatifler</h4>
            <div className="space-y-2">
              {analysis.betterAlternatives.length > 0 ? analysis.betterAlternatives.slice(0,2).map((alt, i) => (
                <div key={i} className="text-xs">
                  <span className="text-white font-bold">{alt.name}:</span> <span className="text-slate-400">{alt.reason}</span>
                </div>
              )) : (
                <div className="text-xs text-slate-400">Şu an bu bütçede daha iyi bir alternatif yok.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
