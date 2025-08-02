# Supabase Setup Checklist for Shopify Webhooks

## ✅ **Database Setup Required**

### 1. Run Base Table Creation
Execute this SQL in your Supabase SQL editor:
```sql
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
```

### 2. Run Update Columns Migration
Execute this SQL to add the new webhook update tracking columns:
```sql
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
```

## ✅ **Environment Variables Checklist**

Make sure these are set in your `.env.local`:
- ✅ `SHOPIFY_DOMAIN` - Your Shopify store domain
- ✅ `SHOPIFY_ACCESS_TOKEN` - Your Shopify API access token
- ✅ `SHOPIFY_WEBHOOK_SECRET` - Your Shopify webhook secret
- ✅ `SUPABASE_URL` - Your Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## ✅ **Verification Steps**

### 1. Test Database Connection
Run this test endpoint to verify Supabase connection:
```bash
curl http://localhost:3000/api/test-supabase
```

### 2. Test Order Creation
Create a test order to verify the system works:
```bash
curl -X POST http://localhost:3000/api/test-order-update \
  -H "Content-Type: application/json" \
  -d '{"orderId": 123456789}'
```

### 3. Verify Table Structure
Check that your `salmacollection` table has these columns:
- `id` (BIGINT PRIMARY KEY)
- `name` (VARCHAR)
- `email` (VARCHAR)
- `created_at` (TIMESTAMP)
- `total_price` (DECIMAL)
- `line_items` (JSONB)
- `shipping_address` (JSONB)
- `billing_address` (JSONB)
- `tags` (VARCHAR)
- `fulfillment_status` (VARCHAR)
- `financial_status` (VARCHAR)
- `note` (TEXT)
- `customer` (JSONB)
- `parcel_status` (VARCHAR)
- `droppex_response` (JSONB)
- `created_at_db` (TIMESTAMP)
- `raw` (JSONB)
- `shop_domain` (VARCHAR)
- `updated_at` (TIMESTAMP WITH TIME ZONE) ← **NEW**
- `updated_in_shopify` (BOOLEAN) ← **NEW**

## ✅ **Ready to Receive Webhooks**

Once you've completed the above steps, your system is ready to:
1. ✅ Receive order creation webhooks from Shopify
2. ✅ Receive order update webhooks from Shopify
3. ✅ Display "Updated in Shopify" badges
4. ✅ Track update timestamps
5. ✅ Clear flags when orders are processed

## 🚀 **Next Steps**

1. **Deploy to Production**: Push your changes to Vercel
2. **Test Webhooks**: Create/update an order in Shopify to test
3. **Monitor Logs**: Check Vercel function logs for webhook processing
4. **Verify UI**: Check that orders appear with proper status badges

Your system is now ready to receive test orders from Shopify! 🎉 