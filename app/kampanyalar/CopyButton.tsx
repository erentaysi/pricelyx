'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ code, tracking_link }: { code: string, tracking_link: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    
    // YENI: Arka planda Affiliate linkini tetikle (First Click kurali icin)
    if (tracking_link) {
      window.open(tracking_link, '_blank');
    }

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all min-w-[120px] ${
        copied 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
          : 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20'
      }`}
    >
      {copied ? (
        <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Kopyalandı</span>
      ) : (
        <span className="flex items-center gap-2"><Copy className="w-4 h-4" /> Kodu Kopyala</span>
      )}
    </button>
  );
}
