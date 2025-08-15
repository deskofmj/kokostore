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
SHOPIFY_DOMAIN=yaemvu-17.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
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
   - Update `SHOPIFY_WEBHOOK_SECRET` in Vercel environment variables
   - Restart the Vercel deployment

3. **Check Webhook Status**
   - In Shopify admin, check if webhook shows as "Active"
   - Look for any error messages or failed delivery attempts

### **If Webhook is Triggered but Data is Missing:**

1. **Check Webhook Payload**
   - Use the debug endpoint: `/api/shopify-webhook-debug`
   - Verify the webhook contains complete order data

2. **Verify Signature**
   - Test signature verification: `/api/test-webhook-secret`
   - Ensure `SHOPIFY_WEBHOOK_SECRET` matches Shopify

3. **Check Processing Logic**
   - Review webhook processing logs
   - Verify data mapping in `mapShopifyOrderToOrder` function

### **If Webhook Fails with Errors:**

1. **Check Vercel Function Logs**
   - Look for 500 errors or timeout issues
   - Verify database connection

2. **Test Database Connection**
   - Use `/api/test-supabase` endpoint
   - Ensure Supabase credentials are correct

3. **Check Function Timeout**
   - Vercel functions have 10-second timeout
   - Optimize database queries if needed

## 📋 **Verification Checklist**

### **Webhook Configuration** ✅
- [ ] Webhook URL is correct
- [ ] Order creation event is enabled
- [ ] Order edit event is enabled
- [ ] Format is set to JSON
- [ ] Webhook shows as "Active" in Shopify

### **Environment Variables** ✅
- [ ] `SHOPIFY_WEBHOOK_SECRET` is set
- [ ] `SHOPIFY_DOMAIN` is correct
- [ ] `SHOPIFY_ACCESS_TOKEN` is valid
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### **Endpoint Accessibility** ✅
- [ ] Webhook endpoint is accessible via POST
- [ ] No authentication required for webhook
- [ ] Signature verification is working
- [ ] Database operations are successful

### **Data Processing** ✅
- [ ] Complete order data is received
- [ ] Customer information is mapped correctly
- [ ] Orders are saved to database
- [ ] "Updated in Shopify" flag works

## 🚀 **Next Steps**

1. **Verify webhook configuration in Shopify admin**
2. **Test with a new order creation**
3. **Check Vercel function logs for webhook processing**
4. **Update environment variables if needed**
5. **Restart Vercel deployment after changes**

## 📞 **Support**

If issues persist:
1. Check Vercel function logs for specific error messages
2. Verify webhook configuration in Shopify admin
3. Test individual components using the test endpoints
4. Ensure all environment variables are correctly set

The webhook is the key to getting complete customer data from Shopify! 🎯
