# Shopify Webhook Update Feature

## Overview

This feature handles order updates from Shopify webhooks. When an order is updated in Shopify, it will be automatically updated in the database and marked with an "Updated in Shopify" indicator.

## Features

### 1. Order Update Handling
- **Webhook Endpoint**: `/api/shopify-webhook`
- **Supported Events**: Order creation and order updates
- **Database Updates**: Orders are overwritten with the latest data from Shopify

### 2. Visual Indicators
- **"Updated in Shopify" Badge**: Shows on orders that have been updated via webhook
- **Update Timestamp**: Displays when the order was last updated in Shopify
- **Order Details**: Shows update information in the order details dialog

### 3. Database Schema Changes
New columns added to the `salmacollection` table:
- `updated_at`: Timestamp when the order was last updated
- `updated_in_shopify`: Boolean flag indicating if the order was updated via Shopify webhook

## Implementation Details

### Webhook Processing
1. **Signature Verification**: All webhooks are verified using Shopify's HMAC signature
2. **Order Detection**: Checks if order already exists in database
3. **Update Logic**: 
   - New orders: Inserted with `parcel_status = 'Not sent'`
   - Existing orders: Updated with latest data and `updated_in_shopify = true`

### Status Management
- **Flag Clearing**: The "Updated in Shopify" flag is cleared when:
  - Order is sent to Droppex
  - Order is reverted to "Not sent" status
- **Persistence**: Flag remains until order is processed or reverted

### Database Migration
Run the following SQL to add the new columns:
```sql
-- Add columns for tracking order updates from Shopify
ALTER TABLE salmacollection 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_in_shopify BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salmacollection_updated_in_shopify 
ON salmacollection(updated_in_shopify);

CREATE INDEX IF NOT EXISTS idx_salmacollection_updated_at 
ON salmacollection(updated_at);
```

## Testing

### Test Endpoint
Use `/api/test-order-update` to simulate an order update:
```bash
curl -X POST http://localhost:3000/api/test-order-update \
  -H "Content-Type: application/json" \
  -d '{"orderId": 123456789}'
```

### Webhook Testing
1. **Local Testing**: Use ngrok to expose local server
2. **Production**: Webhooks are configured to send to `https://salmacollectionorders.vercel.app/`

## Configuration

### Shopify Webhook Setup
The following webhooks are configured:
- **Order creation**: Sends JSON to webhook endpoint
- **Order edit**: Sends JSON to webhook endpoint

### Environment Variables
Ensure these are set:
- `SHOPIFY_WEBHOOK_SECRET`: For webhook signature verification
- `SUPABASE_URL`: Database connection
- `SUPABASE_SERVICE_ROLE_KEY`: Database access

## UI Components

### Order Table
- Shows "Updated in Shopify" badge below status badge
- Badge appears only for orders with `updated_in_shopify = true`

### Order Details Dialog
- Displays update timestamp when available
- Shows "Updated in Shopify" timestamp in order information section

## API Endpoints

### Updated Endpoints
- `POST /api/shopify-webhook`: Handles order creation and updates
- `POST /api/send-to-carrier`: Clears update flag when sending to Droppex
- `POST /api/revert-order`: Clears update flag when reverting order

### New Endpoints
- `POST /api/test-order-update`: Test endpoint for simulating updates

## Error Handling
- **Invalid Signatures**: Returns 401 for unverified webhooks
- **Database Errors**: Logs errors and returns 500
- **Missing Data**: Validates required fields before processing

## Monitoring
- All webhook processing is logged
- Database errors are captured and logged
- Update timestamps are preserved for audit trail 