-- Canteen QR Database Schema
-- Run this SQL in your Supabase SQL editor

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token VARCHAR(20) UNIQUE NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
    payment_id VARCHAR(255),
    payment_signature VARCHAR(255),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_token ON public.orders(token);

-- Create index on user_email for user order history
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders(user_email);

-- Create index on created_at for date-based queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Create index on status for queue management
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Enable Row Level Security (optional)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to see their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Create a policy to allow order creation
CREATE POLICY "Allow order creation" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.orders TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;