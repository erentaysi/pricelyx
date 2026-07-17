import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Veritabanı bağlantı kontrolü
    const { data, error } = await supabase.from('products').select('id').limit(1);
    
    if (error) throw error;

    const latency = Date.now() - startTime;

    return NextResponse.json({
      status: 'OK',
      database: 'connected',
      latencyMs: latency,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({
      status: 'ERROR',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
