"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  User, 
  Bot, 
  ChevronDown,
  Loader2,
  Minimize2,
  Maximize2
} from 'lucide-react';

export default function AICoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: 'Selam kankam! Ben Piinti AI. 🧐 Sana en uygun ürünü bulmada veya fiyat analizi yapmada yardımcı olabilirim. Ne arıyorsun?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      
      if (data.text) {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: data.text }]);
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('AICoach Error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'bot', 
        text: 'Üzgünüm kankam, şu an bağlantı kuramıyorum. Biraz sonra tekrar dener misin? 🤖' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-[2rem] shadow-2xl shadow-primary/20 flex items-center justify-center text-white hover:scale-110 transition-all duration-300 z-[100] group"
      >
        <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-2 -right-2 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 w-[380px] ${isMinimized ? 'h-16' : 'h-[550px]'} bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 border border-slate-100 flex flex-col overflow-hidden transition-all duration-500 z-[100]`}>
        {/* Header */}
        <div className="bg-slate-900 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-primary border border-white/10">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-white font-black text-sm tracking-tight leading-none">PIINTI AI COACH</h3>
                   <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Çevrimiçi
                   </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsMinimized(!isMinimized)} className="text-slate-400 hover:text-white transition-colors">
                    {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        {!isMinimized && (
            <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                            {m.role === 'bot' && (
                                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm mb-1">
                                    <Bot className="w-4 h-4" />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm font-medium shadow-sm transition-all duration-300 ${
                                m.role === 'user' 
                                ? 'bg-primary text-white rounded-br-none' 
                                : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                            }`}>
                                {m.text}
                            </div>
                            {m.role === 'user' && (
                                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm mb-1">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start items-center gap-3 text-slate-400 p-2">
                           <Loader2 className="w-5 h-5 animate-spin" />
                           <span className="text-xs font-bold uppercase tracking-widest italic opacity-50">Kankan Düşünüyor...</span>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-5 bg-white border-t border-slate-100">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Kankana bir şeyler sor..." 
                            className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-6 pr-14 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-[9px] text-slate-400 text-center mt-4 font-bold uppercase tracking-widest opacity-50">
                        Piinti AI bazen hatalı bilgi üretebilir. Her zaman fiyatı kontrol edin.
                    </p>
                </div>
            </>
        )}
    </div>
  );
}
