"use client";

import { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!email || !password || !name) {
      setMessage({ text: 'Lütfen tüm alanları doldurunuz.', type: 'error' });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) {
      setMessage({ text: 'Kayıt başarısız: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'Kayıt Başarılı! Lütfen e-postanızı kontrol edin.', type: 'success' });
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!email || !password) {
      setMessage({ text: 'Lütfen e-posta ve şifrenizi giriniz.', type: 'error' });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage({ text: 'Giriş başarısız: E-posta veya şifre hatalı.', type: 'error' });
      setLoading(false);
    } else {
      setMessage({ text: 'Giriş Başarılı! Yönlendiriliyorsunuz...', type: 'success' });
      router.push('/profil');
      router.refresh();
    }
  };

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      setMessage({ text: 'Google ile giriş başarısız.', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center relative overflow-hidden bg-white">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-[100px] mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[120px] mix-blend-multiply pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,white_100%)] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative z-10 transition-all">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-500/20 transform rotate-3">
                <ShieldCheck className="w-8 h-8 text-white -rotate-3" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Piinti'ye Hoş Geldin</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Favorilerini kaydet, fiyat düşünce ilk sen öğren!</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 border-l-4 rounded-r-xl text-sm font-bold flex items-center shadow-sm ${message.type === 'error' ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-emerald-50 border-emerald-500 text-emerald-600'}`}>
            {message.text}
          </div>
        )}

        <form className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 group">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 group-focus-within:text-teal-600 transition-colors ml-1" htmlFor="name">Ad Soyad (Kayıt İçin)</label>
             <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-teal-500" />
                <input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-700"
                />
             </div>
          </div>

          <div className="flex flex-col gap-1.5 group">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 group-focus-within:text-teal-600 transition-colors ml-1" htmlFor="email">E-Posta</label>
             <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-teal-500" />
                <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-700"
                />
             </div>
          </div>

          <div className="flex flex-col gap-1.5 group">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 group-focus-within:text-teal-600 transition-colors ml-1" htmlFor="password">Şifre</label>
             <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-teal-500" />
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-700"
                />
             </div>
          </div>

          <div className="flex gap-4 mt-4">
             <button
                 onClick={handleLogin}
                 disabled={loading}
                 className="flex-1 flex justify-center items-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 shadow-slate-900/10 disabled:opacity-50"
             >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Giriş Yap'}
             </button>
             <button
                 onClick={handleSignup}
                 disabled={loading}
                 className="flex-1 flex justify-center items-center bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50"
             >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kayıt Ol'}
             </button>
          </div>

          <div className="relative flex items-center py-2 mt-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Veya</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              Google ile Giriş Yap
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
           <Link href="/" className="text-sm font-bold text-slate-400 hover:text-teal-600 transition-colors">Ana Sayfaya Dön</Link>
        </div>
      </div>
    </div>
  );
}
