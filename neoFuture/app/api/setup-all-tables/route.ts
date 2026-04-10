import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 Setting up all required tables...');

        // Create all tables in the correct order (respecting foreign key dependencies)
        const { error: setupError } = await supabase.rpc('exec_sql', {
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

        -- Create orders table
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          delivery_address TEXT,
          notes TEXT,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create cart table
        CREATE TABLE IF NOT EXISTS cart (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, product_id)
        );

        -- Create ratings table
        CREATE TABLE IF NOT EXISTS ratings (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          rated_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          rater_type VARCHAR(10) NOT NULL CHECK (rater_type IN ('buyer', 'seller')),
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          review TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(order_id, rater_id)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        
        CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
        
        CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
        CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
        
        CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
        CREATE INDEX IF NOT EXISTS idx_cart_product ON cart(product_id);
        
        CREATE INDEX IF NOT EXISTS idx_ratings_order ON ratings(order_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_rated ON ratings(rated_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_type ON ratings(rater_type);
      `
        });

        if (setupError) {
            console.error('Error setting up tables:', setupError);
            return NextResponse.json(
                { error: 'Failed to setup tables', details: setupError },
                { status: 500 }
            );
        }

        console.log('✅ All tables created successfully');

        return NextResponse.json({
            success: true,
            message: 'All tables created successfully',
            tables: ['users', 'products', 'orders', 'cart', 'ratings']
        });

    } catch (error) {
        console.error('Table setup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Checking all tables...');

        const tables = ['users', 'products', 'orders', 'cart', 'ratings'];
        const tableStatus: any = {};

        for (const tableName of tables) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('count')
                    .limit(1);

                tableStatus[tableName] = {
                    exists: !error,
                    error: error?.message || null,
                    errorCode: error?.code || null
                };
            } catch (err) {
                tableStatus[tableName] = {
                    exists: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                    errorCode: null
                };
            }
        }

        const allTablesExist = Object.values(tableStatus).every((status: any) => status.exists);

        return NextResponse.json({
            success: true,
            tables: tableStatus,
            allTablesExist,
            message: allTablesExist
                ? 'All tables exist and are accessible'
                : 'Some tables are missing. Use POST to create them.'
        });

    } catch (error) {
        console.error('Table check error:', error);
        return NextResponse.json(
            { error: 'Failed to check tables' },
            { status: 500 }
        );
    }
}