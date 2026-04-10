-- Order Requests Feature Database Setup
-- Run these SQL commands in your Supabase SQL editor

-- Create order_requests table
CREATE TABLE IF NOT EXISTS order_requests (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    by_date DATE NOT NULL,
    allow_multiple_farmers BOOLEAN DEFAULT FALSE,
    description TEXT DEFAULT '',
    max_price_per_unit DECIMAL(10,2) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_applications table
CREATE TABLE IF NOT EXISTS order_applications (
    id SERIAL PRIMARY KEY,
    order_request_id INTEGER NOT NULL REFERENCES order_requests(id) ON DELETE CASCADE,
    farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price_per_unit DECIMAL(10,2) NOT NULL CHECK (price_per_unit > 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity > 0),
    delivery_date DATE DEFAULT NULL,
    notes TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_request_id, farmer_id) -- Prevent duplicate applications from same farmer
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_requests_buyer_id ON order_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_requests_status ON order_requests(status);
CREATE INDEX IF NOT EXISTS idx_order_requests_by_date ON order_requests(by_date);
CREATE INDEX IF NOT EXISTS idx_order_applications_order_request_id ON order_applications(order_request_id);
CREATE INDEX IF NOT EXISTS idx_order_applications_farmer_id ON order_applications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_order_applications_status ON order_applications(status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_order_requests_updated_at ON order_requests;
CREATE TRIGGER update_order_requests_updated_at
    BEFORE UPDATE ON order_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_applications_updated_at ON order_applications;
CREATE TRIGGER update_order_applications_updated_at
    BEFORE UPDATE ON order_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: RLS (Row Level Security) is disabled for this setup since the application
-- uses custom authentication with integer user IDs instead of Supabase Auth.
-- Security is handled at the application level through API routes.

-- Disable RLS for these tables (if previously enabled)
ALTER TABLE order_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_applications DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies
DROP POLICY IF EXISTS "Buyers can view their own order requests" ON order_requests;
DROP POLICY IF EXISTS "Buyers can create order requests" ON order_requests;
DROP POLICY IF EXISTS "Buyers can update their own order requests" ON order_requests;
DROP POLICY IF EXISTS "Farmers can view open order requests" ON order_requests;
DROP POLICY IF EXISTS "Farmers can view their own applications" ON order_applications;
DROP POLICY IF EXISTS "Buyers can view applications to their requests" ON order_applications;
DROP POLICY IF EXISTS "Farmers can create applications" ON order_applications;
DROP POLICY IF EXISTS "Buyers can update application status" ON order_applications;

-- Insert some sample data for testing (optional)
-- Uncomment the lines below if you want sample data

/*
-- Sample order requests (replace user IDs with actual buyer IDs from your users table)
INSERT INTO order_requests (buyer_id, product_name, quantity, by_date, allow_multiple_farmers, description, max_price_per_unit) VALUES
(1, 'Fresh Tomatoes', 100, '2024-02-15', true, 'Need high quality tomatoes for restaurant', 50.00),
(1, 'Organic Wheat', 500, '2024-02-20', false, 'Looking for organic wheat grain', 35.00),
(2, 'Green Chilies', 50, '2024-02-18', true, 'Spicy green chilies needed', 80.00);

-- Sample applications (replace user IDs with actual farmer IDs from your users table)
INSERT INTO order_applications (order_request_id, farmer_id, price_per_unit, available_quantity, notes) VALUES
(1, 3, 45.00, 80, 'Fresh harvest from organic farm'),
(1, 4, 48.00, 120, 'Premium quality tomatoes'),
(2, 3, 32.00, 500, 'Certified organic wheat');
*/

-- Verify tables were created successfully
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('order_requests', 'order_applications')
ORDER BY table_name, ordinal_position;