-- Database Migration: Droppex to First Delivery for Koko Store
-- This script updates the existing database to work with First Delivery instead of Droppex

-- 1. Rename the droppex_response column to first_delivery_response
ALTER TABLE kokostore_orders 
RENAME COLUMN droppex_response TO first_delivery_response;

-- 2. Update existing parcel_status values from 'Sent to Droppex' to 'Sent to First Delivery'
UPDATE kokostore_orders 
SET parcel_status = 'Sent to First Delivery' 
WHERE parcel_status = 'Sent to Droppex';

-- 3. Add a comment to document the change
COMMENT ON COLUMN kokostore_orders.first_delivery_response IS 'Response data from First Delivery API';

-- 4. Verify the changes
SELECT 
  parcel_status,
  COUNT(*) as count
FROM kokostore_orders 
GROUP BY parcel_status;

-- 5. Show the new column structure
\d kokostore_orders;
