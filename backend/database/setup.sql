/**
 * Database setup and migration scripts
 * SQL commands to set up the Supabase database
 */

-- =============================================
-- COLLEGE CANTEEN QR ORDERING SYSTEM DATABASE
-- =============================================
-- Execute these commands in your Supabase SQL Editor

-- 1. Create the orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token VARCHAR(20) UNIQUE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  payment_id VARCHAR(255),
  payment_signature VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(token);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_today ON orders(created_at) 
  WHERE created_at >= CURRENT_DATE;

-- 3. Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);

-- 4. Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Create a view for today's orders (optional, for easier querying)
CREATE OR REPLACE VIEW todays_orders AS
SELECT 
  id,
  token,
  user_name,
  user_email,
  phone,
  items,
  total_amount,
  status,
  payment_id,
  created_at,
  updated_at
FROM orders
WHERE created_at >= CURRENT_DATE
ORDER BY created_at ASC;

-- 6. Create a view for active orders (optional)
CREATE OR REPLACE VIEW active_orders AS
SELECT 
  id,
  token,
  user_name,
  user_email,
  phone,
  items,
  total_amount,
  status,
  created_at,
  updated_at
FROM orders
WHERE status IN ('pending', 'preparing', 'ready')
ORDER BY created_at ASC;

-- 7. Enable Row Level Security (RLS) - OPTIONAL
-- Uncomment these if you want to enable RLS for additional security
-- Note: This will require additional policies to be set up

-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust as needed):
-- CREATE POLICY "Users can view their own orders" ON orders
--   FOR SELECT USING (user_email = auth.email());

-- CREATE POLICY "Service role can manage all orders" ON orders
--   FOR ALL USING (auth.role() = 'service_role');

-- 8. Create some sample data (optional, for testing)
-- Uncomment this if you want to insert test data

/*
INSERT INTO orders (token, user_name, user_email, phone, items, total_amount, status, payment_id) VALUES
('T-001', 'John Doe', 'john@example.com', '+919876543210', 
 '[{"id": "tea", "name": "Tea", "price": 15, "quantity": 2}, {"id": "samosa", "name": "Samosa", "price": 10, "quantity": 3}]',
 60.00, 'completed', 'pay_test123'),
('T-002', 'Jane Smith', 'jane@example.com', '+919876543211',
 '[{"id": "coffee", "name": "Coffee", "price": 20, "quantity": 1}]',
 20.00, 'ready', 'pay_test124'),
('T-003', 'Bob Wilson', 'bob@example.com', '+919876543212',
 '[{"id": "sandwich", "name": "Sandwich", "price": 50, "quantity": 1}, {"id": "juice", "name": "Orange Juice", "price": 25, "quantity": 1}]',
 75.00, 'preparing', 'pay_test125');
*/

-- 9. Create a function to get daily statistics
CREATE OR REPLACE FUNCTION get_daily_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  total_orders BIGINT,
  total_revenue DECIMAL,
  pending_orders BIGINT,
  preparing_orders BIGINT,
  ready_orders BIGINT,
  completed_orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_orders,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'preparing') as preparing_orders,
    COUNT(*) FILTER (WHERE status = 'ready') as ready_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders
  FROM orders
  WHERE DATE(created_at) = target_date;
END;
$$ LANGUAGE plpgsql;

-- 10. Create a function to generate the next token for today
CREATE OR REPLACE FUNCTION get_next_token()
RETURNS VARCHAR(20) AS $$
DECLARE
  next_number INTEGER;
  token VARCHAR(20);
BEGIN
  SELECT COUNT(*) + 1 INTO next_number
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  token := 'T-' || LPAD(next_number::TEXT, 3, '0');
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to verify your setup

-- Check if table was created successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'orders';

-- Test the daily stats function
SELECT * FROM get_daily_stats();

-- Test the token generation function
SELECT get_next_token();

-- =============================================
-- MAINTENANCE QUERIES
-- =============================================
-- Useful queries for maintenance

-- Clean up old completed orders (older than 30 days)
-- DELETE FROM orders 
-- WHERE status = 'completed' 
-- AND created_at < NOW() - INTERVAL '30 days';

-- Reset daily token counter (run this at midnight if needed)
-- This is automatically handled by the date-based token generation

-- Get performance insights
-- SELECT 
--   status,
--   COUNT(*) as count,
--   AVG(total_amount) as avg_amount,
--   MIN(created_at) as earliest,
--   MAX(created_at) as latest
-- FROM orders
-- GROUP BY status;

COMMENT ON TABLE orders IS 'Main table for storing canteen orders and tokens';
COMMENT ON COLUMN orders.token IS 'Daily sequential token (T-001, T-002, etc.)';
COMMENT ON COLUMN orders.items IS 'JSON array of ordered items with quantities and prices';
COMMENT ON COLUMN orders.status IS 'Order status: pending, preparing, ready, completed';
COMMENT ON COLUMN orders.payment_id IS 'Razorpay payment ID for verification';
COMMENT ON COLUMN orders.payment_signature IS 'Razorpay payment signature for security';