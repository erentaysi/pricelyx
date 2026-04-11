"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function FavoriteButton({ productId }: { productId: string }) {
    const [isFav, setIsFav] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    const supabase = createClient();

    useEffect(() => {
        async function fetchStatus() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                const { data } = await supabase.from('user_favorites').select('id').eq('product_id', productId).eq('user_id', session.user.id).single();
                if (data) setIsFav(true);
            }
            setLoading(false);
        }
        fetchStatus();
    }, [productId, supabase]);

    const toggleFavorite = async () => {
        if (!user) {
            router.push('/giris');
            return;
        }

        setIsFav(!isFav); // Optimistic UI
        
        if (isFav) {
            await supabase.from('user_favorites').delete().eq('product_id', productId).eq('user_id', user.id);
        } else {
            await supabase.from('user_favorites').insert({ product_id: productId, user_id: user.id });
        }
    };

    if (loading) return (
       <button className="w-12 h-12 bg-white/80 backdrop-blur border border-slate-100 text-slate-200 rounded-2xl flex items-center justify-center shadow-xl cursor-wait" disabled>
           <Heart className="w-5 h-5 animate-pulse" />
       </button>
    );

    return (
        <button 
           onClick={toggleFavorite}
           className={`w-12 h-12 bg-white/80 backdrop-blur border rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 
           ${isFav ? 'text-rose-500 border-rose-200 bg-rose-50' : 'text-slate-400 border-slate-100 hover:text-rose-500 hover:border-rose-100'}`}
           title="Favorilere Ekle"
        >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500' : ''}`} />
        </button>
    );
}
