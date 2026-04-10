import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('🚀 Creating Supabase tables using service role...');

    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create users table
    const { data: usersResult, error: usersError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (usersError) {
      console.error('Error creating users table:', usersError);
    } else {
      console.log('✅ Users table created successfully');
    }

    // Create products table
    const { data: productsResult, error: productsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (productsError) {
      console.error('Error creating products table:', productsError);
    } else {
      console.log('✅ Products table created successfully');
    }

    // Create indexes
    const { data: indexResult, error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
        CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      `
    });

    if (indexError) {
      console.error('Error creating indexes:', indexError);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // Check if there were any errors
    const hasErrors = usersError || productsError || indexError;
    
    if (hasErrors) {
      return NextResponse.json({
        success: false,
        message: 'Some tables may not have been created properly',
        errors: {
          users: usersError?.message,
          products: productsError?.message,
          indexes: indexError?.message
        },
        note: 'You may need to create tables manually in Supabase dashboard'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All tables created successfully!',
      results: {
        users: usersResult,
        products: productsResult,
        indexes: indexResult
      }
    });

  } catch (error) {
    console.error('Table creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create tables', 
        details: error instanceof Error ? error.message : 'Unknown error',
        note: 'You may need to create tables manually in Supabase dashboard'
      },
      { status: 500 }
    );
  }
}