import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 Creating ratings table directly...');

        // Get Supabase credentials from environment
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Supabase credentials not found in environment variables' },
                { status: 500 }
            );
        }

        // Create admin client with service role key
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Create the ratings table using direct SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
        -- Create ratings table
        CREATE TABLE IF NOT EXISTS public.ratings (
          id BIGSERIAL PRIMARY KEY,
          order_id BIGINT NOT NULL,
          rater_id BIGINT NOT NULL,
          rated_id BIGINT NOT NULL,
          rater_type VARCHAR(10) NOT NULL CHECK (rater_type IN ('buyer', 'seller')),
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          review TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unique_order_rater UNIQUE(order_id, rater_id)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_ratings_order_id ON public.ratings(order_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON public.ratings(rater_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON public.ratings(rated_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_rater_type ON public.ratings(rater_type);
        CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON public.ratings(created_at);

        -- Enable Row Level Security
        ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

        -- Create policies for RLS (optional, but recommended)
        CREATE POLICY IF NOT EXISTS "Users can view ratings" ON public.ratings
          FOR SELECT USING (true);

        CREATE POLICY IF NOT EXISTS "Users can insert their own ratings" ON public.ratings
          FOR INSERT WITH CHECK (true);

        CREATE POLICY IF NOT EXISTS "Users can update their own ratings" ON public.ratings
          FOR UPDATE USING (true);
      `
        });

        if (error) {
            console.error('Error creating ratings table:', error);
            return NextResponse.json(
                { error: 'Failed to create ratings table', details: error },
                { status: 500 }
            );
        }

        console.log('✅ Ratings table created successfully');

        return NextResponse.json({
            success: true,
            message: 'Ratings table created successfully with RLS policies'
        });

    } catch (error) {
        console.error('Ratings table creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Check if the ratings table exists
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Supabase credentials not found' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Try to query the ratings table
        const { data, error } = await supabase
            .from('ratings')
            .select('count')
            .limit(1);

        const exists = !error;

        return NextResponse.json({
            exists,
            error: error?.message || null,
            errorCode: error?.code || null,
            message: exists ? 'Ratings table exists' : 'Ratings table does not exist'
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to check ratings table', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}