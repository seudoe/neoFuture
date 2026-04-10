-- ============================================
-- STEP 1: Create order_tracking_logs table
-- ============================================

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

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_order_tracking_logs_order_id ON order_tracking_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_logs_timestamp ON order_tracking_logs(timestamp);

-- ============================================
-- STEP 3: Add tracking_code column to orders
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(50) UNIQUE;

-- ============================================
-- STEP 4: Generate tracking codes for existing orders
-- ============================================

DO $$
DECLARE
  order_record RECORD;
  new_tracking_code VARCHAR(50);
BEGIN
  FOR order_record IN SELECT id FROM orders WHERE tracking_code IS NULL
  LOOP
    new_tracking_code := 'TRK-' || LPAD(order_record.id::TEXT, 8, '0') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    UPDATE orders SET tracking_code = new_tracking_code WHERE id = order_record.id;
  END LOOP;
END $$;

-- ============================================
-- STEP 5: Create initial tracking logs for existing orders
-- ============================================

INSERT INTO order_tracking_logs (order_id, status, timestamp, updated_by_type, notes)
SELECT 
  id,
  status,
  order_date,
  'system',
  'Order created'
FROM orders
WHERE id NOT IN (SELECT DISTINCT order_id FROM order_tracking_logs);

-- ============================================
-- STEP 6: Create function to auto-generate tracking codes
-- ============================================

CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code := 'TRK-' || LPAD(NEW.id::TEXT, 8, '0') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: Create trigger for new orders
-- ============================================

DROP TRIGGER IF EXISTS set_tracking_code ON orders;
CREATE TRIGGER set_tracking_code
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_tracking_code();

-- ============================================
-- STEP 8: Create function to auto-log status changes
-- ============================================

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
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

-- ============================================
-- STEP 9: Create trigger for status changes
-- ============================================

DROP TRIGGER IF EXISTS track_order_status_changes ON orders;
CREATE TRIGGER track_order_status_changes
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if table was created
SELECT COUNT(*) as tracking_logs_count FROM order_tracking_logs;

-- Check if tracking codes were generated
SELECT COUNT(*) as orders_with_tracking FROM orders WHERE tracking_code IS NOT NULL;

-- Show sample tracking codes
SELECT id, tracking_code, status FROM orders LIMIT 5;

-- Show sample tracking logs
SELECT * FROM order_tracking_logs ORDER BY timestamp DESC LIMIT 5;
