"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

    const navLinks = [
      { name: "Ana Sayfa", href: "/" },
      { name: "Tüm Ürünler", href: "/urunler" },
      { name: "Kampanyalar", href: "/kampanyalar" },
      { name: "Rehber & Blog", href: "/blog" },
      { name: "Mağaza Açın", href: "/satici/basvuru" },
    ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative w-[180px] h-[60px] group-hover:scale-105 transition-transform duration-300">
              <Image 
                src="/logo.png" 
                alt="Piinti Logo" 
                fill 
                priority
                className="object-contain"
              />
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-sm font-bold text-slate-500 hover:text-primary transition-colors h-11 flex items-center px-4"
              >
                {link.name}
              </Link>
            ))}
            
            {/* User Auth Info */}
            {session ? (
              <Link href="/hesabim" className="flex items-center gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white px-5 py-2.5 rounded-2xl text-sm font-black transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95">
                <User className="w-4 h-4" /> Hesabım
              </Link>
            ) : (
              <Link href="/giris" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 active:scale-95">
                <User className="w-4 h-4" /> Giriş Yap
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-primary transition-all rounded-2xl border border-slate-100 bg-white shadow-sm active:scale-95 z-[60]"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer & Backdrop */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] transition-opacity duration-300" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 md:hidden bg-white border-t border-slate-100 py-6 px-4 shadow-2xl z-[58] fade-in transform origin-top">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className="text-base font-bold text-slate-600 hover:text-primary hover:bg-slate-50 p-4 rounded-2xl transition-all flex items-center min-h-[44px] border border-transparent hover:border-slate-100"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
