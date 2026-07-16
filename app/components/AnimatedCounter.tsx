'use client';
import { useEffect, useState, useRef } from 'react';

interface Props {
  value: number;
  label: string;
}

export default function AnimatedCounter({ value, label }: Props) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let start = 0;
          const duration = 2000;
          const increment = value / (duration / 16);
          
          const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={elementRef} className="text-center group cursor-default p-4 hover:bg-white/5 rounded-3xl transition-colors">
        <div className="text-4xl sm:text-5xl font-black text-white group-hover:-translate-y-1 transition-transform tracking-tighter">
          {new Intl.NumberFormat('tr-TR').format(count)}+
        </div>
        <div className="text-slate-500 text-xs sm:text-sm font-black uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
}
