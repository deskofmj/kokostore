# 🔗 Shopify Webhook Verification Guide

## 🎯 **Problem Identified**

The customer information is showing as "N/A" because the Shopify webhook is not properly configured or not being triggered. Our processing logic works correctly (verified with manual test), but the webhook is not sending complete order data.

## ✅ **What We've Verified**

### 1. **Processing Logic Works** ✅
- Manual webhook test with complete data works perfectly
- Customer information is saved correctly when data is available
- Database schema supports all required fields

### 2. **API Limitations Confirmed** ✅
- Shopify API has restrictions and doesn't return complete customer data
- Webhook is the correct way to get complete order information
- Direct API calls return incomplete data for privacy reasons

## 🔧 **Webhook Setup Verification**

### **Step 1: Check Webhook Configuration in Shopify Admin**

1. **Login to Shopify Admin**
   - Go to your Shopify store admin panel
   - Navigate to **Settings** → **Notifications**

2. **Verify Webhook Configuration**
   - Scroll down to **"Webhooks"** section
   - Look for webhooks pointing to: `https://salmacollectionorders.vercel.app/api/shopify-webhook`
   - Ensure these events are configured:
     - ✅ **Order creation**
     - ✅ **Order edit**

3. **Check Webhook Details**
   - **Format**: JSON
   - **URL**: `https://salmacollectionorders.vercel.app/api/shopify-webhook`
   - **Authentication**: None (uses signature verification)

### **Step 2: Verify Environment Variables**

Check that these are set in your Vercel environment:
```bash
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_from_shopify
```

### **Step 3: Test Webhook Endpoint**

Test if the webhook endpoint is accessible:
```bash
# Test GET access
curl https://salmacollectionorders.vercel.app/api/test-webhook-access

# Test POST access
curl -X POST https://salmacollectionorders.vercel.app/api/test-webhook-access \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### **Step 4: Check Vercel Function Logs**

1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to **Functions** tab
4. Look for `/api/shopify-webhook` function
5. Check for any error logs or webhook processing logs

## 🧪 **Testing Webhook Functionality**

### **Test 1: Manual Webhook Test**
```bash
curl -X POST "http://localhost:3000/api/test-webhook-manual" \
  -H "Content-Type: application/json"
```

**Expected Result**: Order with complete customer data is created

### **Test 2: Create Test Order in Shopify**
1. Go to your Shopify admin
2. Create a new test order with complete customer information
3. Check if webhook is triggered
4. Verify order appears in your dashboard with correct customer data

### **Test 3: Update Existing Order**
1. Edit an existing order in Shopify
2. Add or modify customer information
3. Save the order
4. Check if webhook updates the order in your database

## 🔍 **Troubleshooting Steps**

### **If Webhook is Not Triggered:**

1. **Check Webhook URL**
   - Ensure URL is correct: `https://salmacollectionorders.vercel.app/api/shopify-webhook`
   - No typos or extra characters

2. **Verify Webhook Secret**
   - Copy the webhook secret from Shopify admin
   - Ensure it matches your environment variable

3. **Check Webhook Status**
   - In Shopify admin, webhooks should show as "Active"
   - Check for any error messages

4. **Verify Domain**
   - Ensure your domain is accessible from Shopify
   - Check if there are any SSL/HTTPS issues

### **If Webhook is Triggered but Data is Missing:**

1. **Check Webhook Payload**
   - Add logging to see what data is being received
   - Verify the webhook signature is valid

2. **Check Database Schema**
   - Ensure all required fields exist in your database
   - Verify field types match expected data types

3. **Check Processing Logic**
   - Review the webhook processing code
   - Add debug logging to trace data flow

## 📊 **Expected Webhook Data Structure**

When working correctly, the webhook should receive:

```json
{
  "id": 123456789,
  "name": "#1001",
  "email": "customer@example.com",
  "total_price": "99.99",
  "shipping_address": {
    "name": "John Doe",
    "address1": "123 Main St",
    "city": "Tunis",
    "province": "Tunis",
    "zip": "1000",
    "phone": "+21612345678"
  },
  "customer": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "customer@example.com",
    "phone": "+21612345678"
  },
  "line_items": [
    {
      "title": "Product Name",
      "quantity": 1,
      "price": "99.99"
    }
  ],
  "note": "Order notes"
}
```

## 🚀 **Next Steps**

1. **Verify webhook configuration** in Shopify admin
2. **Test webhook endpoint** accessibility
3. **Create test order** to trigger webhook
4. **Check logs** for any errors
5. **Verify data** is being processed correctly

## 📞 **Support**

If you continue to have issues:

1. Check the Vercel function logs for errors
2. Verify your webhook configuration in Shopify
3. Test with a simple webhook payload
4. Contact support with specific error messages

---

**Note**: This system is designed to work with webhooks only. No Shopify API access token is required, making it more secure and privacy-compliant.
