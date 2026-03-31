'use client';
import { useState, FormEvent } from 'react';
import { Bell, X, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  productId: string;
  productTitle: string;
  currentPrice: number;
}

export default function PriceAlertModal({ productId, productTitle, currentPrice }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState(currentPrice > 0 ? Math.floor(currentPrice * 0.9) : ''); // %10 ucuzu
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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
          targetPrice
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      setStatus('success');
      setMessage(data.message);
      
      // 3 Saniye sonra kapat
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
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
              <h3 className="text-2xl font-black text-slate-800 leading-tight">İndirim Zili</h3>
              <p className="text-slate-500 text-sm mt-2 line-clamp-2">
                <span className="font-semibold text-slate-700">{productTitle}</span> ürünü seçtiğin fiyata düştüğünde sana gizlice haber vereceğiz.
              </p>
            </div>

            {/* Form Segment */}
            {status === 'success' ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <CheckCircle size={64} className="text-green-500" />
                <h4 className="text-xl font-black text-slate-800">Alarm Kuruldu!</h4>
                <p className="text-slate-500">Maaşını bekleyenler kervanına hoş geldin. Fiyat düştüğü an e-postana düşeceğiz!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">E-Posta Adresin</label>
                  <input 
                    type="email" 
                    id="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sanaulasalim@gmail.com" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all placeholder-slate-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-bold text-slate-700 mb-1.5">Beklediğin Fiyat (TL)</label>
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
                     <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        Şu anki en düşük fiyat: <span className="font-bold text-slate-600">{currentPrice} TL</span>
                     </p>
                  )}
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
