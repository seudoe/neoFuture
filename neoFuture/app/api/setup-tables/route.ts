import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🚀 Setting up Supabase tables...');

    // First, let's try to create the tables using raw SQL
    // We'll use the database connection directly
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone_number VARCHAR(20) UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'buyer')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create products table
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          quantity INTEGER NOT NULL,
          seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          price_single DECIMAL(10,2) NOT NULL,
          price_multiple DECIMAL(10,2),
          location VARCHAR(255),
          description TEXT,
          photos TEXT[],
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
        CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      `
    });

    if (error) {
      console.error('SQL execution error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create tables', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Tables created successfully');

    return NextResponse.json({
      success: true,
      message: 'Tables created successfully',
      data
    });

  } catch (error) {
    console.error('Table setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Table setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}