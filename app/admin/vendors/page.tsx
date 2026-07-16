'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setVendors(data);
    setLoading(false);
  }

  async function updateVendorStatus(id: number, newStatus: string) {
    if (!confirm(`Satıcı statüsünü '${newStatus}' olarak değiştirmek istediğinize emin misiniz?`)) return;
    
    const { error } = await supabase
      .from('vendors')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setVendors(vendors.map(v => v.id === id ? { ...v, status: newStatus } : v));
    } else {
      alert('Hata oluştu: ' + error.message);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Satıcı Yönetimi</h1>
        <button onClick={fetchVendors} className="text-sm font-bold bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
          Yenile
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-400 uppercase tracking-widest text-[10px]">
                <th className="py-5 px-6 font-black">ID</th>
                <th className="py-5 px-6 font-black">Mağaza Adı</th>
                <th className="py-5 px-6 font-black">Durum</th>
                <th className="py-5 px-6 font-black">XML Feed</th>
                <th className="py-5 px-6 font-black text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500 font-medium">Yükleniyor...</td></tr>
              ) : vendors.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500 font-medium">Hiç satıcı bulunamadı.</td></tr>
              ) : (
                vendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-400">#{vendor.id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {vendor.logo ? (
                          <div className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden">
                            <Image src={vendor.logo} alt="Logo" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200"></div>
                        )}
                        <span className="font-bold text-slate-900">{vendor.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {vendor.status === 'pending' && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100"><AlertTriangle className="w-3 h-3" /> Bekliyor</span>}
                      {vendor.status === 'approved' && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"><CheckCircle className="w-3 h-3" /> Onaylı</span>}
                      {vendor.status === 'suspended' && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100"><XCircle className="w-3 h-3" /> Askıda</span>}
                    </td>
                    <td className="py-4 px-6">
                      {vendor.xml_feed_url ? (
                        <a href={vendor.xml_feed_url} target="_blank" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                          XML Linki <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Yok</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {vendor.status !== 'approved' && (
                          <button onClick={() => updateVendorStatus(vendor.id, 'approved')} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors">Onayla</button>
                        )}
                        {vendor.status !== 'suspended' && (
                          <button onClick={() => updateVendorStatus(vendor.id, 'suspended')} className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition-colors">Askıya Al</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
