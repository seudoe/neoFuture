import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Checking if Supabase tables exist...');

    // Test users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    // Test products table
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    // Correct logic: table exists only if there's NO error
    const usersExists = !usersError;
    const productsExists = !productsError;

    console.log('Users check:', { data: usersData, error: usersError, exists: usersExists });
    console.log('Products check:', { data: productsData, error: productsError, exists: productsExists });

    return NextResponse.json({
      success: true,
      tables: {
        users: {
          exists: usersExists,
          error: usersError?.message || null,
          errorCode: usersError?.code || null
        },
        products: {
          exists: productsExists,
          error: productsError?.message || null,
          errorCode: productsError?.code || null
        }
      },
      allTablesExist: usersExists && productsExists,
      instructions: !usersExists || !productsExists ? {
        message: 'Tables are missing or not accessible. Please create them manually in Supabase dashboard.',
        steps: [
          '1. Go to https://supabase.com/dashboard/project/ntsoxhlkznakdzvfeimp',
          '2. Navigate to SQL Editor',
          '3. Run the SQL provided below'
        ],
        sql: `-- Create users table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);`
      } : null
    });

  } catch (error) {
    console.error('Table check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check tables', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}