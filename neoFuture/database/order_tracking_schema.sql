-- Order Tracking Logs Table
-- This table stores all status changes with timestamps for complete order history

CREATE TABLE IF NOT EXISTS order_tracking_logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  updated_by_type VARCHAR(20) CHECK (updated_by_type IN ('buyer', 'seller', 'system')),
  notes TEXT,
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_order_tracking_logs_order_id ON order_tracking_logs(order_id);
CREATE INDEX idx_order_tracking_logs_timestamp ON order_tracking_logs(timestamp);

-- Add tracking_code to orders table for QR generation
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(50) UNIQUE;

-- Function to generate unique tracking code
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code := 'TRK-' || LPAD(NEW.id::TEXT, 8, '0') || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking code on order creation
CREATE TRIGGER set_tracking_code
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_tracking_code();

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO order_tracking_logs (order_id, status, timestamp, updated_by_type, notes)
    VALUES (
      NEW.id,
      NEW.status,
      NOW(),
      'system',
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Order created'
        ELSE 'Status updated from ' || OLD.status || ' to ' || NEW.status
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-log status changes
CREATE TRIGGER track_order_status_changes
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- View for easy tracking data retrieval
CREATE OR REPLACE VIEW order_tracking_view AS
SELECT 
  o.id as order_id,
  o.tracking_code,
  o.status as current_status,
  o.order_date,
  o.quantity,
  o.total_price,
  o.delivery_address,
  p.name as product_name,
  p.category as product_category,
  p.photos as product_photos,
  u_seller.name as seller_name,
  u_seller.phone_number as seller_phone,
  u_buyer.name as buyer_name,
  json_agg(
    json_build_object(
      'status', otl.status,
      'timestamp', otl.timestamp,
      'updated_by_type', otl.updated_by_type,
      'notes', otl.notes,
      'location', otl.location
    ) ORDER BY otl.timestamp ASC
  ) as tracking_history
FROM orders o
LEFT JOIN products p ON o.product_id = p.id
LEFT JOIN users u_seller ON o.seller_id = u_seller.id
LEFT JOIN users u_buyer ON o.buyer_id = u_buyer.id
LEFT JOIN order_tracking_logs otl ON o.id = otl.order_id
GROUP BY o.id, p.name, p.category, p.photos, u_seller.name, u_seller.phone_number, u_buyer.name;

-- Grant necessary permissions (adjust based on your RLS policies)
-- ALTER TABLE order_tracking_logs ENABLE ROW LEVEL SECURITY;

-- Sample RLS policy for public tracking page (read-only)
-- CREATE POLICY "Allow public read access to tracking logs"
--   ON order_tracking_logs FOR SELECT
--   USING (true);

COMMENT ON TABLE order_tracking_logs IS 'Stores complete history of order status changes with timestamps';
COMMENT ON COLUMN order_tracking_logs.status IS 'Order status: pending, confirmed, shipped, delivered, cancelled';
COMMENT ON COLUMN order_tracking_logs.updated_by_type IS 'Who updated: buyer, seller, or system';
COMMENT ON COLUMN orders.tracking_code IS 'Unique tracking code for QR generation and public tracking';
