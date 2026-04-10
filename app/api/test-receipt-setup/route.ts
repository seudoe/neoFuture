import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const results: any = {
    database: { status: 'unknown', details: {} },
    supabase: { status: 'unknown', details: {} },
    environment: { status: 'unknown', details: {} }
  };

  try {
    // Check environment variables
    results.environment.details = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
    results.environment.status = 'ok';

    // Check database columns
    const client = await pool.connect();
    const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('receipt_url', 'receipt_generated', 'receipt_generated_at')
    `);
    
    results.database.details = {
      columns: columnCheck.rows,
      hasReceiptUrl: columnCheck.rows.some(r => r.column_name === 'receipt_url'),
      hasReceiptGenerated: columnCheck.rows.some(r => r.column_name === 'receipt_generated'),
      hasReceiptGeneratedAt: columnCheck.rows.some(r => r.column_name === 'receipt_generated_at'),
    };
    results.database.status = columnCheck.rows.length === 3 ? 'ok' : 'missing_columns';
    
    client.release();

    // Check Supabase Storage
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      results.supabase.status = 'error';
      results.supabase.details = { error: bucketsError.message };
    } else {
      const receiptsBucket = buckets?.find(b => b.name === 'receipts');
      results.supabase.details = {
        buckets: buckets?.map(b => b.name),
        hasReceiptsBucket: !!receiptsBucket,
      };
      results.supabase.status = receiptsBucket ? 'ok' : 'missing_bucket';
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }

  const allOk = results.database.status === 'ok' && 
                results.supabase.status === 'ok' && 
                results.environment.status === 'ok';

  return NextResponse.json({
    success: allOk,
    message: allOk ? 'Receipt system is ready!' : 'Receipt system needs setup',
    results
  });
}
