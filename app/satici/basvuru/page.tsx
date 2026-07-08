'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Link, Mail, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function VendorApplicationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    xmlUrl: '',
    taxId: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      if (isLoginMode) {
        // GİRİŞ YAP (LOGIN)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (signInError) throw signInError;
        
        // Giriş başarılıysa sayfayı yenile/yönlendir
        window.location.href = '/satici/panel';
        return;
      }

      // 1. Supabase Auth Kaydı (SIGN UP)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Kullanıcı oluşturulamadı.');

      // 2. Vendor Tablosuna Ekleme (status otomatik 'pending' olacak)
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .insert({
          name: formData.name,
          xml_feed_url: formData.xmlUrl,
          contact_email: formData.email,
          tax_id: formData.taxId
        })
        .select('id')
        .single();

      if (vendorError) {
        // İsim benzersiz (unique) ihlali vb.
        throw new Error('Mağaza kaydı sırasında hata: ' + vendorError.message);
      }

      // 3. Eşleştirme tablosuna (vendor_users) ekleme
      const { error: vuError } = await supabase
        .from('vendor_users')
        .insert({
          vendor_id: vendorData.id,
          auth_id: authData.user.id,
          role: 'admin'
        });

      if (vuError) throw vuError;

      setStatus('success');
    } catch (err: any) {
      console.error('Başvuru Hatası:', err);
      setErrorMessage(err.message || 'Bilinmeyen bir hata oluştu.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Başvurunuz Alındı!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Mağaza bilgileriniz ve XML entegrasyon talebiniz sistemimize ulaştı. Yöneticilerimiz verilerinizi inceledikten sonra mağazanız onaylanacaktır.
          </p>
          <a href="/" className="inline-block bg-slate-900 text-white font-bold px-8 py-4 rounded-xl uppercase tracking-widest text-sm hover:bg-primary transition-colors">
            Anasayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        
        {/* Sol Taraf - Bilgi */}
        <div>
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Satıcı Ağımıza<br />
            <span className="text-primary">Katılın.</span>
          </h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed">
            Binlerce ürünü analiz eden akıllı fiyat karşılaştırma motorumuz Piinti'ye mağazanızı ekleyin. Satışlarınızı artırmak için otomatik XML entegrasyonu ile ürünlerinizi hemen listeleyin.
          </p>
          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Otomatik XML Senkronizasyonu</h4>
                <p className="text-sm text-slate-500">Stok ve fiyatlarınız her 6 saatte bir sistemimiz tarafından otomatik güncellenir.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Gelişmiş B2B Paneli</h4>
                <p className="text-sm text-slate-500">Hangi ürününüz ne kadar tıklandı, senkronizasyon raporlarınız neler anlık takip edin.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Sağ Taraf - Form */}
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl border border-slate-100">
          <h3 className="text-2xl font-black text-slate-900 mb-8">Mağaza Başvuru Formu</h3>
          
          {status === 'error' && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-sm font-bold border border-rose-100">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mağaza Adı</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700" placeholder="Örn: TeknoMarket" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-Posta</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700" placeholder="ornek@magaza.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Şifre</label>
                <div className="relative">
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700" placeholder="En az 6 karakter" />
                </div>
              </div>
            </div>

            {!isLoginMode && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">XML Feed Linki</label>
                  <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input required type="url" value={formData.xmlUrl} onChange={e => setFormData({...formData, xmlUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700" placeholder="https://magaza.com/export/xml" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Lütfen dışarıdan erişilebilir (public) ve şifresiz bir XML URL'si girin.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Vergi Numarası / VKN</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input required type="text" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700" placeholder="VKN veya TC Kimlik No" />
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full bg-primary text-white font-black py-4 rounded-xl mt-6 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-70"
            >
              {status === 'loading' ? 'İşleniyor...' : (isLoginMode ? 'Giriş Yap' : 'Başvuruyu Gönder')} <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => { setIsLoginMode(!isLoginMode); setErrorMessage(''); }}
                className="text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest"
              >
                {isLoginMode ? 'Yeni Mağaza Başvurusu Yap' : 'Zaten hesabınız var mı? Giriş Yapın'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
