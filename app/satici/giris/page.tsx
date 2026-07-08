'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowRight, Store } from 'lucide-react';

export default function VendorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Giriş başarılıysa satıcı paneline yönlendir
      window.location.href = '/satici/panel';
    } catch (err: any) {
      console.error('Giriş Hatası:', err);
      setErrorMessage(err.message || 'Giriş yapılamadı. E-posta veya şifrenizi kontrol edin.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8">
        <Store className="w-8 h-8" />
      </div>
      
      <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl border border-slate-100">
        <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Mağazaya Giriş Yap</h2>
        <p className="text-slate-500 text-sm text-center mb-8 font-medium">Satıcı paneline erişmek için bilgilerinizi girin.</p>
        
        {status === 'error' && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-sm font-bold border border-rose-100">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-Posta</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700" placeholder="ornek@magaza.com" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Şifre</label>
            <div className="relative">
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700" placeholder="••••••••" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-primary text-white font-black py-4 rounded-xl mt-6 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-70"
          >
            {status === 'loading' ? 'Giriş Yapılıyor...' : 'Giriş Yap'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        
        <div className="text-center mt-6">
          <a href="/satici/basvuru" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest">
            Henüz mağazanız yok mu? Başvurun
          </a>
        </div>
      </div>
    </div>
  );
}
