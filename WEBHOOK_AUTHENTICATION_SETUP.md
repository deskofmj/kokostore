# Webhook Authentication Setup

## ✅ **Authentication Configuration**

### Admin Login Credentials
- **Username**: `admin`
- **Password**: `admin`
- **Environment Variables**: 
  - `NEXT_PUBLIC_ADMIN_USERNAME=admin` (optional, defaults to 'admin')
  - `NEXT_PUBLIC_ADMIN_PASSWORD=admin` (optional, defaults to 'admin')

### Webhook Access
- **Webhook Endpoint**: `/api/shopify-webhook`
- **Authentication**: **NO AUTHENTICATION REQUIRED** ✅
- **Security**: Uses Shopify HMAC signature verification instead
- **Access**: Public endpoint for Shopify webhooks

## 🔒 **Security Architecture**

### Dashboard Protection
- **Main Dashboard**: Protected with admin login
- **Login Page**: `/login` with admin/admin credentials
- **Session Management**: 24-hour session with localStorage
- **Auto-redirect**: Unauthenticated users redirected to login

### Webhook Security
- **No Authentication**: Webhooks bypass login system
- **Signature Verification**: Uses Shopify's HMAC-SHA256 signature
- **Environment Variable**: `SHOPIFY_WEBHOOK_SECRET` for verification
- **Secure**: Only Shopify can send valid webhooks

## 🧪 **Testing Webhook Access**

### Test Endpoint
```bash
# Test GET access
curl https://salmacollectionorders.vercel.app/api/test-webhook-access

# Test POST access
curl -X POST https://salmacollectionorders.vercel.app/api/test-webhook-access \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Expected Response
```json
{
  "success": true,
  "message": "Webhook POST endpoint is accessible without authentication",
  "receivedData": {"test": "data"},
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 📋 **Verification Checklist**

### ✅ **Admin Access**
- [ ] Can login with `admin`/`admin` at https://salmacollectionorders.vercel.app/login
- [ ] Dashboard loads after successful login
- [ ] Session persists for 24 hours
- [ ] Logout works correctly

### ✅ **Webhook Access**
- [ ] Webhook endpoint accessible without authentication
- [ ] Shopify signature verification working
- [ ] Orders received and processed correctly
- [ ] "Updated in Shopify" badges appear

### ✅ **Environment Variables**
- [ ] `SHOPIFY_DOMAIN` set correctly
- [ ] `SHOPIFY_WEBHOOK_SECRET` set correctly
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] Optional: `NEXT_PUBLIC_ADMIN_USERNAME` and `NEXT_PUBLIC_ADMIN_PASSWORD` set

## 🚀 **Production Deployment**

### Vercel Environment Variables
Set these in your Vercel dashboard:
```
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=admin
```

### Shopify Webhook Configuration
Your webhooks are configured to send to:
- **URL**: `https://salmacollectionorders.vercel.app/api/shopify-webhook`
- **Events**: Order creation and Order edit
- **Format**: JSON
- **Authentication**: None (uses signature verification)

## 🔍 **Troubleshooting**

### Webhook Not Receiving Data
1. Check Vercel function logs
2. Verify webhook URL in Shopify admin
3. Test with `/api/test-webhook-access` endpoint
4. Ensure `SHOPIFY_WEBHOOK_SECRET` matches Shopify

### Admin Login Issues
1. Clear browser localStorage
2. Check environment variables
3. Verify deployment includes latest changes
4. Try accessing `/login` directly

### Database Issues
1. Run Supabase migrations
2. Check environment variables
3. Test with `/api/test-supabase` endpoint
4. Verify table structure

## 📞 **Support**

If you encounter issues:
1. Check Vercel function logs
2. Test individual endpoints
3. Verify environment variables
4. Ensure database migrations are complete

Your webhook system is now properly configured with admin authentication for the dashboard and secure webhook access for Shopify! 🎉 