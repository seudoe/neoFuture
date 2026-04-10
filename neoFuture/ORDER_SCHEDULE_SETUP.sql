-- Order Schedule Feature Database Setup
-- Run these SQL commands in your Supabase SQL editor AFTER running ORDER_REQUESTS_SETUP.sql

-- Add scheduling columns to existing order_requests table
ALTER TABLE order_requests 
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS schedule_id INTEGER DEFAULT NULL;

-- Create order_schedules table for recurring orders
CREATE TABLE IF NOT EXISTS order_schedules (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    allow_multiple_farmers BOOLEAN DEFAULT FALSE,
    description TEXT DEFAULT '',
    max_price_per_unit DECIMAL(10,2) DEFAULT NULL,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('monthly', 'weekly', 'daily')),
    schedule_day INTEGER DEFAULT NULL, -- Day of month (1-31) for monthly, day of week (0-6) for weekly
    schedule_time TIME DEFAULT '09:00:00', -- Time to create the order
    days_before_needed INTEGER DEFAULT 7, -- How many days before the delivery date to post
    is_active BOOLEAN DEFAULT TRUE,
    next_execution_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_requests_is_scheduled ON order_requests(is_scheduled);
CREATE INDEX IF NOT EXISTS idx_order_requests_schedule_id ON order_requests(schedule_id);
CREATE INDEX IF NOT EXISTS idx_order_schedules_buyer_id ON order_schedules(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_schedules_is_active ON order_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_order_schedules_next_execution ON order_schedules(next_execution_date);

-- Create trigger for order_schedules updated_at
DROP TRIGGER IF EXISTS update_order_schedules_updated_at ON order_schedules;
CREATE TRIGGER update_order_schedules_updated_at
    BEFORE UPDATE ON order_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for order_schedules table
ALTER TABLE order_schedules DISABLE ROW LEVEL SECURITY;

-- Add foreign key constraint for schedule_id (optional, for referential integrity)
-- ALTER TABLE order_requests ADD CONSTRAINT fk_order_requests_schedule_id 
-- FOREIGN KEY (schedule_id) REFERENCES order_schedules(id) ON DELETE SET NULL;

-- Insert sample schedules for testing (optional)
-- Uncomment the lines below if you want sample data

/*
-- Sample schedules (replace user IDs with actual buyer IDs from your users table)
INSERT INTO order_schedules (buyer_id, product_name, quantity, schedule_type, schedule_day, days_before_needed, allow_multiple_farmers, description, max_price_per_unit, next_execution_date) VALUES
(1, 'Fresh Onions', 100, 'monthly', 5, 7, true, 'Monthly supply for restaurant - Auto Order', 40.00, '2024-03-05'),
(1, 'Potatoes', 150, 'monthly', 5, 7, true, 'Monthly potato supply - Auto Order', 30.00, '2024-03-05'),
(2, 'Tomatoes', 80, 'weekly', 1, 3, true, 'Weekly tomato supply for cafe - Auto Order', 45.00, '2024-02-05');
*/

-- Verify tables were created successfully
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('order_schedules')
ORDER BY table_name, ordinal_position;

-- Check if columns were added to order_requests
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_requests' 
AND column_name IN ('is_scheduled', 'schedule_id')
ORDER BY ordinal_position;