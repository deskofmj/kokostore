-- Migration Script: Transform existing table to Koko Store schema
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Rename the existing table to kokostore_orders
ALTER TABLE salmacollection RENAME TO kokostore_orders;

-- Step 2: Rename droppex_response column to first_delivery_response
ALTER TABLE kokostore_orders 
RENAME COLUMN droppex_response TO first_delivery_response;

-- Step 3: Update existing parcel_status values from 'Sent to Droppex' to 'Sent to First Delivery'
UPDATE kokostore_orders 
SET parcel_status = 'Sent to First Delivery' 
WHERE parcel_status = 'Sent to Droppex';

-- Step 4: Add any missing columns (if they don't exist)
-- Note: Most columns already exist based on your CSV, but let's ensure they're all there

-- Add parcel_status column if it doesn't exist (it should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kokostore_orders' AND column_name = 'parcel_status') THEN
        ALTER TABLE kokostore_orders ADD COLUMN parcel_status VARCHAR DEFAULT 'Not sent';
    END IF;
END $$;

-- Add first_delivery_response column if it doesn't exist (should be renamed from droppex_response)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kokostore_orders' AND column_name = 'first_delivery_response') THEN
        ALTER TABLE kokostore_orders ADD COLUMN first_delivery_response JSONB;
    END IF;
END $$;

-- Add created_at_db column if it doesn't exist (it should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kokostore_orders' AND column_name = 'created_at_db') THEN
        ALTER TABLE kokostore_orders ADD COLUMN created_at_db TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at column if it doesn't exist (it should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kokostore_orders' AND column_name = 'updated_at') THEN
        ALTER TABLE kokostore_orders ADD COLUMN updated_at TIMESTAMP;
    END IF;
END $$;

-- Add updated_in_shopify column if it doesn't exist (it should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kokostore_orders' AND column_name = 'updated_in_shopify') THEN
        ALTER TABLE kokostore_orders ADD COLUMN updated_in_shopify BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Step 5: Drop columns that are not needed in the new schema
-- Remove 'raw' and 'shop_domain' columns as they're not in the target schema
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kokostore_orders' AND column_name = 'raw') THEN
        ALTER TABLE kokostore_orders DROP COLUMN raw;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kokostore_orders' AND column_name = 'shop_domain') THEN
        ALTER TABLE kokostore_orders DROP COLUMN shop_domain;
    END IF;
END $$;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_parcel_status ON kokostore_orders(parcel_status);
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_created_at_db ON kokostore_orders(created_at_db);
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_updated_in_shopify ON kokostore_orders(updated_in_shopify);

-- Step 7: Add comments for documentation
COMMENT ON TABLE kokostore_orders IS 'Orders from Shopify stored for First Delivery fulfillment';
COMMENT ON COLUMN kokostore_orders.parcel_status IS 'Order status: Not sent, Sent to First Delivery, Failed';
COMMENT ON COLUMN kokostore_orders.first_delivery_response IS 'Response data from First Delivery API';
COMMENT ON COLUMN kokostore_orders.updated_in_shopify IS 'Flag to track if order was updated in Shopify';

-- Step 8: Enable Row Level Security (RLS) for security
ALTER TABLE kokostore_orders ENABLE ROW LEVEL SECURITY;

-- Step 9: Create a policy that allows all operations
CREATE POLICY "Allow all operations on kokostore_orders" ON kokostore_orders
  FOR ALL USING (true);

-- Step 10: Create a function to update the created_at_db timestamp
CREATE OR REPLACE FUNCTION update_created_at_db()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at_db = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger to automatically update created_at_db
DROP TRIGGER IF EXISTS update_kokostore_orders_created_at_db ON kokostore_orders;
CREATE TRIGGER update_kokostore_orders_created_at_db
  BEFORE INSERT ON kokostore_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_created_at_db();

-- Step 12: Verify the migration was successful
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'kokostore_orders' 
ORDER BY ordinal_position;

-- Step 13: Show current parcel_status distribution
SELECT 
  parcel_status,
  COUNT(*) as count
FROM kokostore_orders 
GROUP BY parcel_status;

-- Step 14: Show sample of migrated data
SELECT 
  id,
  name,
  parcel_status,
  CASE 
    WHEN first_delivery_response IS NOT NULL THEN 'Has First Delivery Response'
    ELSE 'No First Delivery Response'
  END as response_status
FROM kokostore_orders 
LIMIT 5;
