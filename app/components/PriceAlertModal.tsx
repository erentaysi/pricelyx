'use client';
import { useState, useEffect, FormEvent } from 'react';
import { Bell, X, CheckCircle, Loader2, Sparkles, TrendingDown, Target, BarChart3 } from 'lucide-react';

type AlertTypeOption = 'target_price' | 'percentage_drop' | 'lowest_30d' | 'lowest_90d' | 'ai_recommended';

interface Props {
  productId: string;
  productTitle: string;
  currentPrice: number;
}

interface AiRecommendation {
  recommendedPrice: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  basedOnDays: number;
}

export default function PriceAlertModal({ productId, productTitle, currentPrice }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [alertType, setAlertType] = useState<AlertTypeOption>('target_price');
  const [targetPrice, setTargetPrice] = useState(currentPrice > 0 ? Math.floor(currentPrice * 0.9).toString() : '');
  const [percentageThreshold, setPercentageThreshold] = useState('10');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AiRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
     const initSession = async () => {
         const { createClient } = await import('@/lib/supabase/client');
         const supabase = createClient();
         const { data: { session } } = await supabase.auth.getSession();
         if(session?.user) {
             setUser(session.user);
             setEmail(session.user.email || '');
         }
     };
     initSession();
  }, []);

  // AI Önerisi yükle (modal açıldığında)
  useEffect(() => {
    if (isOpen && !aiRecommendation && !aiLoading) {
      fetchAiRecommendation();
    }
  }, [isOpen]);

  const fetchAiRecommendation = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/alerts?productId=${productId}`);
      const data = await res.json();
      if (data.recommendation) {
        setAiRecommendation(data.recommendation);
      }
    } catch { /* Sessizce devam et */ }
    finally { setAiLoading(false); }
  };

  const handleAlertTypeChange = (type: AlertTypeOption) => {
    setAlertType(type);
    if (type === 'ai_recommended' && aiRecommendation) {
      setTargetPrice(aiRecommendation.recommendedPrice.toString());
    } else if (type === 'lowest_30d' || type === 'lowest_90d') {
      setTargetPrice(''); // Backend hesaplayacak
    } else if (type === 'target_price') {
      setTargetPrice(currentPrice > 0 ? Math.floor(currentPrice * 0.9).toString() : '');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          email,
          alertType,
          targetPrice: alertType === 'target_price' || alertType === 'ai_recommended' ? targetPrice : undefined,
          percentageThreshold: alertType === 'percentage_drop' ? percentageThreshold : undefined
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      setStatus('success');
      setMessage(data.message);
      
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
        setMessage('');
      }, 3000);

    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const alertTypeOptions: { type: AlertTypeOption; label: string; icon: any; desc: string }[] = [
    { type: 'target_price', label: 'Hedef Fiyat', icon: Target, desc: 'Belirlediğin fiyata düşünce haber ver' },
    { type: 'percentage_drop', label: 'Yüzdesel Düşüş', icon: TrendingDown, desc: 'Belirli bir yüzde düşünce bildir' },
    { type: 'lowest_30d', label: '30 Gün En Düşük', icon: BarChart3, desc: 'Son 30 günün dibine inince bildir' },
    { type: 'lowest_90d', label: '90 Gün En Düşük', icon: BarChart3, desc: 'Son 90 günün dibine inince bildir' },
    { type: 'ai_recommended', label: 'AI Önerisi', icon: Sparkles, desc: 'Yapay zeka en iyi fırsatı hesaplasın' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
      >
        <Bell size={18} />
        Zile Bas, İndirimi Kaçırma!
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-6 pt-8 pb-5 relative">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-teal-200">
                <Bell size={28} className="animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 leading-tight">Akıllı Fiyat Alarmı</h3>
              <p className="text-slate-500 text-sm mt-2 line-clamp-2">
                <span className="font-semibold text-slate-700">{productTitle}</span> için en uygun alarm tipini seç.
              </p>
            </div>

            {status === 'success' ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <CheckCircle size={64} className="text-green-500" />
                <h4 className="text-xl font-black text-slate-800">Alarm Kuruldu!</h4>
                <p className="text-slate-500">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* Alarm Tipi Seçici */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Alarm Tipi</label>
                  <div className="grid grid-cols-1 gap-2">
                    {alertTypeOptions.map(opt => {
                      const Icon = opt.icon;
                      const isAi = opt.type === 'ai_recommended';
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => handleAlertTypeChange(opt.type)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            alertType === opt.type
                              ? isAi ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200' : 'border-teal-400 bg-teal-50 ring-2 ring-teal-200'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            alertType === opt.type
                              ? isAi ? 'bg-indigo-500 text-white' : 'bg-teal-500 text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <span className={`text-sm font-bold ${alertType === opt.type ? 'text-slate-900' : 'text-slate-600'}`}>{opt.label}</span>
                            <span className="block text-xs text-slate-400">{opt.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Önerisi Bilgi Kartı */}
                {alertType === 'ai_recommended' && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-indigo-500">
                        <Sparkles size={16} className="animate-spin" />
                        <span className="text-sm font-medium">AI analiz ediyor...</span>
                      </div>
                    ) : aiRecommendation ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-indigo-500" />
                          <span className="text-sm font-bold text-indigo-700">AI Önerisi: {aiRecommendation.recommendedPrice}₺</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            aiRecommendation.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
                            aiRecommendation.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {aiRecommendation.confidence === 'high' ? 'Yüksek Güven' : aiRecommendation.confidence === 'medium' ? 'Orta Güven' : 'Düşük Güven'}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-600/70">{aiRecommendation.reasoning}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-indigo-400">Yeterli veri olmadığı için AI önerisi oluşturulamadı.</p>
                    )}
                  </div>
                )}

                {/* Hedef Fiyat Input (Sadece target_price ve ai_recommended tiplerinde) */}
                {(alertType === 'target_price' || alertType === 'ai_recommended') && (
                  <div>
                    <label htmlFor="price" className="block text-sm font-bold text-slate-700 mb-1.5">
                      {alertType === 'ai_recommended' ? 'AI Önerdiği Fiyat (değiştirebilirsin)' : 'Beklediğin Fiyat (TL)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                      <input 
                        type="number" 
                        id="price" 
                        required 
                        min="1"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold text-slate-800"
                      />
                    </div>
                    {currentPrice > 0 && (
                       <p className="text-xs text-slate-400 mt-2">
                          Şu anki en düşük fiyat: <span className="font-bold text-slate-600">{currentPrice.toLocaleString('tr-TR')} TL</span>
                       </p>
                    )}
                  </div>
                )}

                {/* Yüzde Input (Sadece percentage_drop tipinde) */}
                {alertType === 'percentage_drop' && (
                  <div>
                    <label htmlFor="percentage" className="block text-sm font-bold text-slate-700 mb-1.5">Düşüş Yüzdesi</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                      <input 
                        type="number" 
                        id="percentage" 
                        required 
                        min="1" max="99"
                        value={percentageThreshold}
                        onChange={(e) => setPercentageThreshold(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold text-slate-800"
                      />
                    </div>
                    {currentPrice > 0 && (
                       <p className="text-xs text-slate-400 mt-2">
                          Hedef: <span className="font-bold text-slate-600">{Math.round(currentPrice * (1 - parseInt(percentageThreshold || '10') / 100)).toLocaleString('tr-TR')} TL</span> 
                          {' '}(mevcut {currentPrice.toLocaleString('tr-TR')} TL&apos;den %{percentageThreshold} düşüş)
                       </p>
                    )}
                  </div>
                )}

                {/* E-posta */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">E-Posta Adresin</label>
                  <input 
                    type="email" 
                    id="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={user !== null}
                    placeholder="sanaulasalim@gmail.com" 
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all placeholder-slate-400 ${user ? 'opacity-60 cursor-not-allowed text-slate-500' : 'text-slate-800'}`}
                  />
                </div>

                {status === 'error' && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
                    <X size={16} className="mt-0.5 shrink-0" />
                    <p>{message}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Alarmı Başlat'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
