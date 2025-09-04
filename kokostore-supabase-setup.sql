-- Koko Store First Delivery Fulfillment System - Supabase Setup
-- Run this SQL in your Supabase SQL Editor

-- Create the orders table
CREATE TABLE IF NOT EXISTS kokostore_orders (
  id BIGINT PRIMARY KEY,
  name VARCHAR,
  email VARCHAR,
  created_at TIMESTAMP,
  total_price DECIMAL,
  line_items JSONB,
  shipping_address JSONB,
  billing_address JSONB,
  tags VARCHAR,
  fulfillment_status VARCHAR,
  financial_status VARCHAR,
  note TEXT,
  customer JSONB,
  parcel_status VARCHAR DEFAULT 'Not sent',
  first_delivery_response JSONB,
  created_at_db TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  updated_in_shopify BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_parcel_status ON kokostore_orders(parcel_status);
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_created_at_db ON kokostore_orders(created_at_db);
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_updated_in_shopify ON kokostore_orders(updated_in_shopify);

-- Add comments for documentation
COMMENT ON TABLE kokostore_orders IS 'Orders from Shopify stored for First Delivery fulfillment';
COMMENT ON COLUMN kokostore_orders.parcel_status IS 'Order status: Not sent, Sent to First Delivery, Failed';
COMMENT ON COLUMN kokostore_orders.first_delivery_response IS 'Response data from First Delivery API';
COMMENT ON COLUMN kokostore_orders.updated_in_shopify IS 'Flag to track if order was updated in Shopify';

-- Enable Row Level Security (RLS) for security
ALTER TABLE kokostore_orders ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can restrict this based on your needs)
CREATE POLICY "Allow all operations on kokostore_orders" ON kokostore_orders
  FOR ALL USING (true);

-- Optional: Create a function to update the created_at_db timestamp
CREATE OR REPLACE FUNCTION update_created_at_db()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at_db = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update created_at_db
CREATE TRIGGER update_kokostore_orders_created_at_db
  BEFORE INSERT ON kokostore_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_created_at_db();

-- Verify the table was created successfully
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'kokostore_orders' 
ORDER BY ordinal_position;
