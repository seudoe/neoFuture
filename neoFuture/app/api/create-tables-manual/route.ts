import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🚀 Creating tables manually...');

    // Try to insert a test record to see if tables exist
    // If they don't exist, we'll get an error and know we need to create them

    // Check if users table exists
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError && usersError.code === 'PGRST116') {
      console.log('Users table does not exist - it needs to be created in Supabase dashboard');
    }

    // Check if products table exists
    const { error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (productsError && productsError.code === 'PGRST116') {
      console.log('Products table does not exist - it needs to be created in Supabase dashboard');
    }

    return NextResponse.json({
      success: true,
      message: 'Table check completed',
      usersTableExists: !usersError || usersError.code !== 'PGRST116',
      productsTableExists: !productsError || productsError.code !== 'PGRST116',
      instructions: 'If tables do not exist, please create them manually in Supabase dashboard using the SQL provided in the response',
      sql: {
        users: `
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone_number VARCHAR(20) UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'buyer')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `,
        products: `
          CREATE TABLE products (
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
        `,
        indexes: `
          CREATE INDEX idx_users_email ON users(email);
          CREATE INDEX idx_users_phone ON users(phone_number);
          CREATE INDEX idx_products_seller ON products(seller_id);
          CREATE INDEX idx_products_category ON products(category);
          CREATE INDEX idx_products_status ON products(status);
        `
      }
    });

  } catch (error) {
    console.error('Manual table creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Manual table creation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}