import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Checking Supabase connection and tables...');

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('Connection error:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Connection failed',
        details: connectionError
      });
    }

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    // Check products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      connection: 'OK',
      users: {
        error: usersError,
        count: users?.length || 0,
        data: users
      },
      products: {
        error: productsError,
        count: products?.length || 0,
        data: products
      }
    });

  } catch (error) {
    console.error('Supabase check error:', error);
    return NextResponse.json(
      { success: false, error: 'Check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}