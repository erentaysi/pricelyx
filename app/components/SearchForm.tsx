"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/urunler?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
        <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün, marka veya kategori ara..." 
            className="flex-1 px-6 py-4 rounded-lg text-gray-800 search-input text-lg"
        />
        <button type="submit" className="bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-lg font-semibold transition text-lg">
            Ara
        </button>
    </form>
  )
}
