-- SQL Setup for Atomic Token Generation
-- Run this in your Supabase SQL Editor for optimal token generation

-- 1. Create daily counters table
CREATE TABLE IF NOT EXISTS daily_counters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_key DATE NOT NULL UNIQUE,
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS daily_counters_date_idx ON daily_counters(date_key);

-- 3. Create atomic increment function
CREATE OR REPLACE FUNCTION increment_daily_counter(date_input DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_counter INTEGER;
BEGIN
    -- Try to update existing counter for the date
    UPDATE daily_counters 
    SET counter = counter + 1, updated_at = CURRENT_TIMESTAMP
    WHERE date_key = date_input
    RETURNING counter INTO new_counter;
    
    -- If no row was updated, insert a new one
    IF NOT FOUND THEN
        INSERT INTO daily_counters (date_key, counter)
        VALUES (date_input, 1)
        ON CONFLICT (date_key) 
        DO UPDATE SET counter = daily_counters.counter + 1, updated_at = CURRENT_TIMESTAMP
        RETURNING counter INTO new_counter;
    END IF;
    
    RETURN new_counter;
END;
$$;

-- 4. Optional: Create function to reset daily counters (for new day)
CREATE OR REPLACE FUNCTION reset_daily_counter(date_input DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE daily_counters 
    SET counter = 0, updated_at = CURRENT_TIMESTAMP
    WHERE date_key = date_input;
    
    IF NOT FOUND THEN
        INSERT INTO daily_counters (date_key, counter)
        VALUES (date_input, 0);
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 5. Grant necessary permissions 
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON daily_counters TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_daily_counter(DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_daily_counter(DATE) TO anon, authenticated;

-- Test the function (optional)
-- SELECT increment_daily_counter(CURRENT_DATE);
-- SELECT * FROM daily_counters WHERE date_key = CURRENT_DATE;