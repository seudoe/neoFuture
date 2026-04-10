-- Create ratings table for AgriBridge platform
-- Run this SQL in your Supabase SQL Editor

-- Create the ratings table
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view all ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert ratings" ON public.ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update their own ratings" ON public.ratings
  FOR UPDATE USING (true);

-- Grant permissions
GRANT ALL ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO anon;

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'ratings' 
  AND table_schema = 'public'
ORDER BY ordinal_position;