'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Store, Package, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ vendors: 0, pendingVendors: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      // Vendors
      const { count: vCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
      const { count: pvCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      // Products
      const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      
      setStats({
        vendors: vCount || 0,
        pendingVendors: pvCount || 0,
        products: pCount || 0
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Dashboard Genel Bakış</h1>
      
      {loading ? (
        <div className="animate-pulse flex gap-4">
          <div className="w-1/3 h-32 bg-slate-200 rounded-2xl"></div>
          <div className="w-1/3 h-32 bg-slate-200 rounded-2xl"></div>
          <div className="w-1/3 h-32 bg-slate-200 rounded-2xl"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Toplam Mağaza</p>
              <h3 className="text-4xl font-black text-slate-900">{stats.vendors}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Onay Bekleyen</p>
              <h3 className="text-4xl font-black text-slate-900">{stats.pendingVendors}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Toplam Ürün</p>
              <h3 className="text-4xl font-black text-slate-900">{stats.products}</h3>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-12 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Sistem Durumu
        </h2>
        <p className="text-slate-500 font-medium">B2B Yönetim sistemi aktif. Sol menüden satıcıları yönetebilir, onay bekleyen XML başvurularını aktif hale getirebilirsin.</p>
      </div>
    </div>
  );
}
