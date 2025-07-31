-- Diagnostic script to check current table structure
-- Run this in your Supabase SQL editor to see what columns exist

-- Check all columns in the salmacollection table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salmacollection'
ORDER BY ordinal_position;

-- Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'salmacollection'
) as table_exists; 