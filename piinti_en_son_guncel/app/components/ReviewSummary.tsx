"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, MessageSquare, Plus, Minus } from 'lucide-react';

interface ReviewSummaryProps {
  productId: string;
}

export default function ReviewSummary({ productId }: ReviewSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/summarize-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        throw new Error('Özet alınamadı');
      }
    } catch (err) {
      console.error(err);
      setError('Özet oluşturulurken bir hata oluştu kankam. 🤖');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] mb-10 border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 leading-none mb-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Kullanıcı Deneyimi Özeti
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">PIINTI AI SENTIMENT ANALYSIS</p>
        </div>
        {!summary && !isLoading && (
          <button 
            onClick={fetchSummary}
            className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> AI İle Özetle
          </button>
        )}
      </div>

      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Kankalar Ne Diyor Tarıyorum... 🕵️‍♂️</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl text-center text-sm font-bold border border-rose-100">
          {error}
        </div>
      )}

      {summary && (
        <div className="space-y-6 fade-in">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative">
             <div className="absolute -top-3 -left-3 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"><Sparkles className="w-4 h-4" /></div>
             <p className="text-slate-700 leading-relaxed font-medium italic whitespace-pre-line">
               "{summary}"
             </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <Plus className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-black text-emerald-700 uppercase tracking-tight">Kullanıcılar Memnun</span>
             </div>
             <div className="flex items-center gap-3 bg-rose-50 p-4 rounded-xl border border-rose-100">
                <Minus className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-black text-rose-700 uppercase tracking-tight">Dikkat Edilmesi Gerekenler</span>
             </div>
          </div>
          
          <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest opacity-50">
            *Bu özet en son yapılan 10 yorumun yapay zeka analizi ile oluşturulmuştur.
          </p>
        </div>
      )}
    </div>
  );
}
