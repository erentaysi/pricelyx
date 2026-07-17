import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ShieldAlert, Users, Activity, LogOut, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Panel | Piinti',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">Süper Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-slate-300 hover:text-white">
            <Activity className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/admin/vendors" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-slate-300 hover:text-white">
            <Users className="w-4 h-4" /> Mağazalar
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-slate-300 hover:text-white">
            <Settings className="w-4 h-4" /> Ayarlar
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Siteden Çıkış
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
