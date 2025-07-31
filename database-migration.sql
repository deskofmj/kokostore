-- Migration script to add new columns to existing salmacollection table
-- Run these commands ONE BY ONE in your Supabase SQL editor

-- Step 1: Add the raw column
ALTER TABLE salmacollection ADD COLUMN IF NOT EXISTS raw JSONB;

-- Step 2: Add the shop_domain column  
ALTER TABLE salmacollection ADD COLUMN IF NOT EXISTS shop_domain VARCHAR;

-- Step 3: Create index for shop_domain
CREATE INDEX IF NOT EXISTS idx_salmacollection_shop_domain ON salmacollection(shop_domain);

-- Step 4: Verify the columns were added (optional - run this to check)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'salmacollection' 
AND column_name IN ('raw', 'shop_domain');

-- Update any existing records to have default values for new columns
UPDATE salmacollection 
SET 
  raw = NULL,
  shop_domain = NULL
WHERE raw IS NULL OR shop_domain IS NULL; 