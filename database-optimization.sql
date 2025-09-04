-- Database Optimization Script for Koko Store
-- This script adds missing indexes to improve query performance and reduce egress

-- Primary index for order ID lookups (most critical for webhook performance)
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_id ON kokostore_orders(id);

-- Index for parcel status filtering (used in dashboard tabs)
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_parcel_status ON kokostore_orders(parcel_status);

-- Index for created_at_db ordering (used in all order listings)
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_created_at_db ON kokostore_orders(created_at_db);

-- Index for updated_in_shopify flag (used in order management)
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_updated_in_shopify ON kokostore_orders(updated_in_shopify);

-- Composite index for common query patterns (status + date ordering)
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_status_created ON kokostore_orders(parcel_status, created_at_db DESC);

-- Index for email lookups (if needed for customer queries)
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_email ON kokostore_orders(email);

-- Index for order name lookups (if needed for search)
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_name ON kokostore_orders(name);

-- Composite index for ID-based queries with status filtering
CREATE INDEX IF NOT EXISTS idx_kokostore_orders_id_status ON kokostore_orders(id, parcel_status);

-- Analyze tables to update statistics for better query planning
ANALYZE kokostore_orders;

-- Display current indexes for verification
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'kokostore_orders'
ORDER BY indexname;
