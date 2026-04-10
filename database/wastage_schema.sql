-- Add wastage tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS ordered_quantity INTEGER,
ADD COLUMN IF NOT EXISTS delivered_quantity INTEGER,
ADD COLUMN IF NOT EXISTS wasted_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS adjusted_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';

-- Update existing orders to set ordered_quantity from quantity
UPDATE orders 
SET ordered_quantity = quantity,
    original_amount = total_price,
    adjusted_amount = total_price
WHERE ordered_quantity IS NULL;

-- Create order_wastage_reports table
CREATE TABLE IF NOT EXISTS order_wastage_reports (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reported_by INTEGER NOT NULL REFERENCES users(id),
  delivered_quantity INTEGER NOT NULL,
  wasted_quantity INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  photo_urls TEXT[], -- Array of photo URLs for proof
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_order_report UNIQUE(order_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wastage_reports_order ON order_wastage_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_verification ON orders(verification_status);

-- Add check constraints
ALTER TABLE orders 
ADD CONSTRAINT check_quantities 
CHECK (
  (delivered_quantity IS NULL AND wasted_quantity IS NULL) OR
  (delivered_quantity + wasted_quantity <= ordered_quantity)
);

COMMENT ON TABLE order_wastage_reports IS 'Tracks quality issues and wastage reported by buyers';
COMMENT ON COLUMN orders.verification_status IS 'pending, verified, or disputed';
COMMENT ON COLUMN orders.delivered_quantity IS 'Actual quantity received in good condition';
COMMENT ON COLUMN orders.wasted_quantity IS 'Quantity that was damaged, rotten, or missing';
