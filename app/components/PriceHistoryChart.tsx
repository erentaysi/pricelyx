'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface HistoryItem {
  id: number;
  price: number;
  recorded_at: string;
  vendors?: { name: string; color: string; };
}

interface Props {
  historyData: HistoryItem[];
}

export default function PriceHistoryChart({ historyData }: Props) {
  const chartData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    
    // Verileri tarihe göre sırala
    const sorted = [...historyData].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    
    // Tarihleri GG Ay formatına çevir ve price'ları düzenle
    return sorted.map(item => {
      const d = new Date(item.recorded_at);
      const day = d.getDate();
      const month = d.toLocaleString('tr-TR', { month: 'short' });
      return {
        date: `${day} ${month}`,
        fiyat: item.price,
        satici: item.vendors?.name || 'Sistem'
      };
    });
  }, [historyData]);

  if (chartData.length < 2) {
    return (
      <div className="w-full h-48 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
        <span className="text-2xl mb-2">📉</span>
        <p className="text-sm font-medium px-4 text-center">
          Grafik oluşturabilmek için en az 2 farklı fiyat geçmişine ihtiyaç var.<br/>Fiyat değiştikçe burası canlanacak!
        </p>
      </div>
    );
  }

  // Y ekseni min max değerlerini daha şık göstermek için
  const minPrice = Math.min(...chartData.map(d => d.fiyat));
  const maxPrice = Math.max(...chartData.map(d => d.fiyat));
  const padding = (maxPrice - minPrice) * 0.1 || minPrice * 0.1;

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorFiyat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#94a3b8' }} 
            dy={10} 
          />
          <YAxis 
            domain={[Math.max(0, minPrice - padding), maxPrice + padding]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickFormatter={(value) => `₺${value}`}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
            formatter={(value: number) => [`${value} TL`, 'Fiyat']}
            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
          />
          <Line 
            type="monotone" 
            dataKey="fiyat" 
            stroke="#14b8a6" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#0f766e', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#0d9488' }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
