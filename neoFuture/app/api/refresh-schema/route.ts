import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('🔄 Attempting to refresh Supabase schema cache...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Try to make a simple query to each table to force schema refresh
    console.log('Attempting to query users table...');
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    console.log('Users query result:', { data: usersData, error: usersError });

    console.log('Attempting to query products table...');
    const { data: productsData, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id')
      .limit(1);

    console.log('Products query result:', { data: productsData, error: productsError });

    // Try to use the REST API directly to refresh schema
    const refreshResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Schema refresh response status:', refreshResponse.status);

    return NextResponse.json({
      success: true,
      message: 'Schema refresh attempted',
      results: {
        users: {
          data: usersData,
          error: usersError?.message || null
        },
        products: {
          data: productsData,
          error: productsError?.message || null
        },
        refreshStatus: refreshResponse.status
      }
    });

  } catch (error) {
    console.error('Schema refresh error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Schema refresh failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}