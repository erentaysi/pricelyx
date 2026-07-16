'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Bell, Trash2, ExternalLink, LogOut } from 'lucide-react';

export default function HesabimPage() {
  const [activeTab, setActiveTab] = useState<'favorites' | 'alerts'>('favorites');
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/giris');
      return;
    }
    setUser(user);
    await loadData(user.id);
  }

  async function loadData(userId: string) {
    setLoading(true);
    
    // Favorileri Yükle
    const { data: favs } = await supabase
      .from('user_favorites')
      .select(`
        id,
        created_at,
        products (
          id,
          title,
          image_url,
          slug,
          product_prices (price)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favs) setFavorites(favs);

    // Alarmları Yükle
    const { data: alrts } = await supabase
      .from('price_alerts')
      .select(`
        id,
        target_price,
        is_active,
        created_at,
        products (
          id,
          title,
          image_url,
          slug,
          product_prices (price)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (alrts) setAlerts(alrts);
    
    setLoading(false);
  }

  async function removeFavorite(favId: number) {
    await supabase.from('user_favorites').delete().eq('id', favId);
    setFavorites(favorites.filter(f => f.id !== favId));
  }

  async function removeAlert(alertId: number) {
    await supabase.from('price_alerts').delete().eq('id', alertId);
    setAlerts(alerts.filter(a => a.id !== alertId));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/giris');
  }

  // Fiyat hesaplama yardımcısı
  const getMinPrice = (prices: any[]) => {
    if (!prices || prices.length === 0) return 0;
    return Math.min(...prices.map((p: any) => p.price));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hesabım</h1>
            <p className="text-slate-500 font-medium mt-1">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold transition-colors">
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black transition-all ${activeTab === 'favorites' ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-current' : ''}`} /> Favorilerim
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black transition-all ${activeTab === 'alerts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <Bell className={`w-5 h-5 ${activeTab === 'alerts' ? 'fill-current' : ''}`} /> Fiyat Alarmlarım
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-3xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'favorites' && favorites.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500 font-medium bg-white rounded-[2rem] border border-slate-100">
                Henüz hiç favori ürününüz yok. 
              </div>
            )}
            
            {activeTab === 'favorites' && favorites.map(fav => {
              const product = fav.products;
              const minPrice = getMinPrice(product.product_prices);
              return (
                <div key={fav.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative group">
                  <button onClick={() => removeFavorite(fav.id)} className="absolute top-4 right-4 w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-full flex items-center justify-center transition-colors z-10" title="Favorilerden Çıkar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="aspect-square rounded-2xl bg-slate-50 mb-4 overflow-hidden relative">
                    {product.image_url && <Image src={product.image_url} alt={product.title} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <h3 className="font-bold text-slate-900 line-clamp-2 text-sm h-10 mb-2">{product.title}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-black text-primary">{minPrice.toLocaleString('tr-TR')} TL</span>
                    <Link href={`/urun/${product.slug}`} className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {activeTab === 'alerts' && alerts.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500 font-medium bg-white rounded-[2rem] border border-slate-100">
                Hiç fiyat alarmınız bulunmuyor.
              </div>
            )}

            {activeTab === 'alerts' && alerts.map(alert => {
              const product = alert.products;
              const minPrice = getMinPrice(product.product_prices);
              const isTargetReached = minPrice <= alert.target_price;

              return (
                <div key={alert.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative group">
                  <button onClick={() => removeAlert(alert.id)} className="absolute top-4 right-4 w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-full flex items-center justify-center transition-colors z-10" title="Alarmı Sil">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-xl bg-slate-50 flex-shrink-0 relative overflow-hidden">
                      {product.image_url && <Image src={product.image_url} alt={product.title} fill className="object-contain p-2" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 line-clamp-2 text-xs mb-2">{product.title}</h3>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mevcut Fiyat</div>
                      <div className={`text-sm font-black ${isTargetReached ? 'text-emerald-500' : 'text-slate-900'}`}>{minPrice.toLocaleString('tr-TR')} TL</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hedef Fiyat</div>
                      <div className="text-lg font-black text-indigo-600">{alert.target_price.toLocaleString('tr-TR')} TL</div>
                    </div>
                    {isTargetReached ? (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100">Hedefe Ulaştı!</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200">Bekleniyor</span>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}
