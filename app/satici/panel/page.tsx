'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Store, AlertTriangle, CheckCircle, Clock, Activity, FileWarning, RefreshCw } from 'lucide-react';

export default function VendorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/satici/basvuru');
          return;
        }

        // 1. Satıcının yetki bilgisini bul
        const { data: vuData, error: vuError } = await supabase
          .from('vendor_users')
          .select('vendor_id')
          .eq('auth_id', session.user.id)
          .single();

        if (vuError || !vuData) {
          throw new Error('Satıcı yetkiniz bulunamadı.');
        }

        // 2. Satıcı profilini getir
        const { data: vData, error: vError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vuData.vendor_id)
          .single();

        if (vError || !vData) {
          throw new Error('Mağaza profiline erişilemedi.');
        }

        setVendorData(vData);

        // 3. Kalıcı Logları getir (Son 50 işlem)
        const { data: logData } = await supabase
          .from('feed_sync_logs')
          .select('*')
          .eq('vendor_id', vData.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (logData) setLogs(logData);

      } catch (err) {
        console.error('Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Yükleniyor...</div>;
  }

  if (!vendorData) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-rose-500 font-bold">Yetkisiz Erişim.</div>;
  }

  // Durum Yönetimi (Pending / Suspended Kilitleri)
  if (vendorData.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Onay Bekleniyor</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Mağazanız şu an yönetici onayında. Başvurunuz incelendikten sonra XML senkronizasyonunuz başlatılacak ve paneliniz açılacaktır.
          </p>
        </div>
      </div>
    );
  }

  if (vendorData.status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-2xl border border-rose-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Hesap Askıya Alındı</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Tekrarlayan hatalı veri gönderimi veya şüpheli davranış sebebiyle mağazanız askıya alınmıştır. Detaylar için sistem yöneticisiyle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  // Dashboard - Onaylı Satıcı
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{vendorData.name}</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Doğrulanmış Mağaza
              </p>
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/satici/basvuru'); }} className="text-sm font-bold text-slate-500 hover:text-slate-900">
            Çıkış Yap
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Senkronizasyon Geçmişi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest text-[10px]">
                    <th className="py-4 font-black">Tarih</th>
                    <th className="py-4 font-black">Durum</th>
                    <th className="py-4 font-black text-right">Başarılı</th>
                    <th className="py-4 font-black text-right">Hatalı</th>
                    <th className="py-4 font-black">Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500 italic">Henüz senkronizasyon kaydı bulunmuyor.</td></tr>
                  )}
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="py-4 font-medium text-slate-600 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('tr-TR')}
                      </td>
                      <td className="py-4">
                        {log.status === 'success' && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Başarılı</span>}
                        {log.status === 'error' && <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Başarısız</span>}
                        {log.status === 'partial_error' && <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Kısmi Hata</span>}
                      </td>
                      <td className="py-4 font-black text-slate-900 text-right">{log.items_processed}</td>
                      <td className="py-4 font-black text-rose-500 text-right">{log.items_rejected}</td>
                      <td className="py-4 text-xs text-slate-500 max-w-xs truncate" title={log.error_details}>
                        {log.error_details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -mr-16 -mt-16"></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Sistem Durumu</h3>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-black tracking-tight text-xl">XML Feed Aktif</span>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Son Senkronizasyon</p>
              <p className="font-black text-sm">
                {vendorData.last_synced_at ? new Date(vendorData.last_synced_at).toLocaleString('tr-TR') : 'Hiç çalışmadı'}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem]">
             <h3 className="text-amber-800 font-black flex items-center gap-2 mb-2"><FileWarning className="w-5 h-5" /> Veri Kalitesi Kuralları</h3>
             <ul className="text-xs text-amber-700/80 font-medium space-y-2 mt-4">
               <li>• 0₺ veya negatif fiyat gönderen ürünler <strong>reddedilir</strong>.</li>
               <li>• 48 saat güncellenmeyen fiyatlara <strong>uyarı rozeti</strong> eklenir.</li>
               <li>• 72 saat güncellenmeyen fiyatlar arayüzden <strong>tamamen gizlenir</strong>.</li>
               <li>• Sürekli hatalı veri (XXE/XSS) gönderimi hesabı <strong>askıya alır</strong>.</li>
             </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
