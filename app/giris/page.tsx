'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Giriş başarısız: E-posta veya şifre hatalı.');
        setLoading(false);
      } else {
        router.push('/hesabim');
        router.refresh();
      }
    } else {
      // Kayıt Ol
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Kayıt sırasında hata oluştu.');
        setLoading(false);
      } else {
        // API ile kayıt başarılı, şimdi giriş yap
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (loginErr) {
          setError('Kayıt başarılı ama giriş yapılamadı. Lütfen giriş yapmayı deneyin.');
        } else {
          router.push('/hesabim');
          router.refresh();
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          {isLogin ? 'Hesabınıza Giriş Yapın' : 'Yeni Hesap Oluşturun'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          {isLogin ? 'Favorilerinizi ve fiyat alarmlarınızı yönetin' : 'Fırsatları kaçırmamak için hemen ücretsiz üye olun'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700">E-Posta Adresi</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-medium"
                  placeholder="ornek@mail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">Şifre</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-black text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Bekleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 font-medium">Veya</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="w-full flex justify-center py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                {isLogin ? "Hesabın yok mu? Kayıt Ol" : "Zaten üye misin? Giriş Yap"}
              </button>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          Satıcı mısınız? <Link href="/satici/basvuru" className="text-primary hover:underline font-bold">Mağaza Girişi Yapın</Link>
        </p>
      </div>
    </div>
  );
}
