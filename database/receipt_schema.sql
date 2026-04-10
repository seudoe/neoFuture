-- Add receipt fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_receipt_generated ON orders(receipt_generated);

-- Create receipts bucket in Supabase Storage (run this in Supabase SQL Editor)
-- Note: Bucket creation is typically done via Supabase Dashboard or API
-- This is just for reference
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Set storage policy to allow authenticated users to read
CREATE POLICY "Allow public read access to receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Allow service role to insert receipts
CREATE POLICY "Allow service role to upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts');
*/
