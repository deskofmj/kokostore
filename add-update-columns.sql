-- Add columns for tracking order updates from Shopify
ALTER TABLE salmacollection 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_in_shopify BOOLEAN DEFAULT FALSE;

-- Add index for better performance when querying updated orders
CREATE INDEX IF NOT EXISTS idx_salmacollection_updated_in_shopify 
ON salmacollection(updated_in_shopify);

-- Add index for updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_salmacollection_updated_at 
ON salmacollection(updated_at); 