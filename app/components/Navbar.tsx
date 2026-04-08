"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Ana Sayfa", href: "/" },
    { name: "Tüm Ürünler", href: "/urunler" },
    { name: "Kampanyalar", href: "/kampanyalar" },
    { name: "Hakkımızda", href: "/hakkimizda" },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <svg width="160" height="40" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-105 transition-transform duration-300">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: "#2E86AB", stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: "#A23B72", stopOpacity: 1}} />
                </linearGradient>
              </defs>
              <path d="M 10 35 L 10 15 C 10 10 15 5 20 5 L 30 5 C 35 5 40 10 40 15 C 40 20 35 25 30 25 L 20 25 M 10 25 L 35 45" 
                stroke="url(#logoGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="45" y="32" fontFamily="'Inter', sans-serif" fontSize="26" fontWeight="900" fill="url(#logoGradient)">Piinti v2</text>
              <text x="48" y="42" fontFamily="'Inter', sans-serif" fontSize="8" fontWeight="600" fill="#94a3b8" letterSpacing="1">PREMIUM ANALYTICS</text>
            </svg>
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
