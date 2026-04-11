'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto">
          <span className="text-4xl">⚠️</span>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kritik Bir Hata Oluştu</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Şu an isteğinizi gerçekleştiremiyoruz. Teknik ekibimiz durumdan haberdar edildi.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
          >
            Tekrar Dene
          </button>
          <Link 
            href="/"
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-sm"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left overflow-auto max-h-40">
            <p className="text-[10px] font-mono text-rose-600 whitespace-pre-wrap">
              {error.message}
              {error.stack}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
