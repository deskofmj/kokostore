-- Shopify Droppex Fulfillment System Database Setup
-- Run this in your Supabase SQL editor

-- Create the salmacollection table
CREATE TABLE IF NOT EXISTS salmacollection (
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
  droppex_response JSONB,
  created_at_db TIMESTAMP DEFAULT NOW(),
  -- Additional fields for cross-platform compatibility
  raw JSONB,
  shop_domain VARCHAR
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salmacollection_parcel_status ON salmacollection(parcel_status);
CREATE INDEX IF NOT EXISTS idx_salmacollection_created_at ON salmacollection(created_at);
CREATE INDEX IF NOT EXISTS idx_salmacollection_email ON salmacollection(email);
CREATE INDEX IF NOT EXISTS idx_salmacollection_shop_domain ON salmacollection(shop_domain);

-- Enable Row Level Security (RLS) for security
ALTER TABLE salmacollection ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can restrict this based on your needs)
CREATE POLICY "Allow all operations on salmacollection" ON salmacollection
  FOR ALL USING (true);

-- Optional: Create a function to update the created_at_db timestamp
CREATE OR REPLACE FUNCTION update_created_at_db()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at_db = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update created_at_db
CREATE TRIGGER update_salmacollection_created_at_db
  BEFORE INSERT ON salmacollection
  FOR EACH ROW
  EXECUTE FUNCTION update_created_at_db(); 