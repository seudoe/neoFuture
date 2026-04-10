import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 Creating ratings table...');

        // Create ratings table
        const { error: ratingsError } = await supabase.rpc('exec_sql', {
            sql: `
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
        CREATE INDEX IF NOT EXISTS idx_ratings_order_id ON ratings(order_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON ratings(rated_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_rater_type ON ratings(rater_type);
      `
        });

        if (ratingsError) {
            console.error('Error creating ratings table:', ratingsError);
            return NextResponse.json(
                { error: 'Failed to create ratings table', details: ratingsError },
                { status: 500 }
            );
        }

        console.log('✅ Ratings table created successfully');

        return NextResponse.json({
            success: true,
            message: 'Ratings table created successfully'
        });

    } catch (error) {
        console.error('Ratings table creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}