# 🔄 Data Flow Analysis: Koko Store Shopify → Supabase → First Delivery

## Overview

This document explains how order data flows from Shopify through our system to First Delivery, including data validation, mapping, and potential issues.

## 📊 Data Flow Diagram

```
Shopify Order → Webhook → Supabase → Validation → First Delivery API
     ↓              ↓         ↓         ↓           ↓
  Raw Data    Processed   Stored    Validated   Formatted
```

## 🔍 Detailed Data Flow

### 1. **Shopify Data Structure**

```typescript
// Raw Shopify Order
{
  id: number,                    // Order ID
  name: string,                  // Order name (e.g., "#1001")
  email: string,                 // Customer email
  total_price: string,           // ⚠️ STRING from Shopify
  shipping_address: {
    name: string,                // Customer name
    address1: string,           // Street address
    city: string,               // City
    province: string,           // State/Province
    zip: string,                // ⚠️ Postal code (ZIP)
    country: string,            // Country
    phone: string               // Phone number
  },
  customer: {
    first_name: string,
    last_name: string,
    phone: string
  },
  line_items: Array,            // Order items
  note: string                  // Order notes
}
```

### 2. **Supabase Storage**

```typescript
// Stored in Supabase
{
  id: number,                    // Order ID
  name: string,                  // Order name
  email: string,                 // Customer email
  total_price: number,           // ✅ Converted to NUMBER
  shipping_address: object,      // ✅ Stored as JSON
  customer: object,              // ✅ Stored as JSON
  parcel_status: string,         // 'Not sent' | 'Sent to First Delivery' | 'Failed'
  first_delivery_response: object, // Response from First Delivery API
  created_at_db: string         // When record was created
}
```

### 3. **First Delivery Mapping**

```typescript
// Mapped to First Delivery API format
{
  Client: {
    nom: string,                 // Customer name
    gouvernerat: string,         // Province/State
    ville: string,               // City
    adresse: string,             // Street address
    telephone: string,           // Phone number
    telephone2: string           // Secondary phone
  },
  Produit: {
    article: string,             // Order name
    prix: number,                // ✅ Total price (converted to number)
    designation: string,         // Product description
    nombreArticle: number,       // Number of items
    commentaire: string,         // Order notes
    nombreEchange: number        // Exchange count (default: 0)
  }
}
```

## ⚠️ **Critical Issues Identified**

### **1. Price Handling**
- **Issue**: Shopify sends `total_price` as a **string**
- **Solution**: ✅ Converted to **number** in Supabase storage
- **First Delivery**: ✅ **SENT** - First Delivery requires price information

### **2. Postal Code Issues**
- **Issue**: Missing or invalid postal codes
- **Shopify**: `shipping_address.zip` (string)
- **Supabase**: Stored as JSON in `shipping_address.zip`
- **First Delivery**: ✅ **NOT REQUIRED** - First Delivery doesn't need postal codes

### **3. Data Validation Issues**
- **Missing Required Fields**: Address, city, phone, customer name
- **Invalid Formats**: Phone numbers, governorate names
- **Default Values**: Using fallbacks when data is missing

## 🔧 **Data Mapping Solutions**

### **Phone Number Cleaning**
```typescript
// Clean phone number: remove +216 prefix and non-digits
const cleanPhoneNumber = (phoneStr: string): string => {
  if (phoneStr === '00000000') return phoneStr
  
  // Remove +216 prefix if present
  let cleaned = phoneStr.replace(/^\+216/, '')
  
  // Remove any other non-digit characters
  cleaned = cleaned.replace(/\D/g, '')
  
  // If the number starts with 216 after cleaning, remove it
  if (cleaned.startsWith('216')) {
    cleaned = cleaned.substring(3)
  }
  
  // Ensure we have a valid length (8 digits for Tunisian numbers)
  if (cleaned.length === 8) {
    return cleaned
  } else if (cleaned.length > 8) {
    return cleaned.slice(-8)
  } else {
    return cleaned.padEnd(8, '0')
  }
}
```

### **Governorate Detection**
```typescript
// Enhanced governorate detection from address information
const detectGovernorateFromAddress = (order: Order): { governorate: string, method: string } => {
  const address = order.shipping_address?.address1 || ''
  const city = order.shipping_address?.city || ''
  const zipCode = order.shipping_address?.zip || ''
  const province = order.shipping_address?.province || ''
  
  // Method 1: Postal code detection (most accurate)
  if (zipCode) {
    const governorateFromPostal = getGovernorateFromPostalCode(zipCode as string)
    if (governorateFromPostal) {
      return { governorate: governorateFromPostal, method: 'postal_code' }
    }
  }
  
  // Method 2: Check if province is already a valid governorate
  // Method 3: Detect from city name
  // Method 4: Detect from postal code ranges
  // Method 5: Search in address text
  
  // Default fallback
  return { governorate: 'Tunis', method: 'default' }
}
```

## 📊 **Data Quality Indicators**

### **Critical Issues (Block Order Sending)**
- Missing shipping address
- Missing shipping city
- Missing customer name
- Missing phone number

### **Warnings (Allow Order Sending)**
- Missing postal code
- Missing province/governorate
- Invalid phone number format
- No order items

### **Quality Score Calculation**
```typescript
const qualityScore = Math.max(0, 100 - (issues.length * 20) - (warnings.length * 10))
```

## 🚀 **First Delivery API Integration**

### **Rate Limiting**
- **Single orders**: 1 request every 10 seconds
- **Bulk orders**: 1 request every 10 seconds
- **Implementation**: Built-in rate limiting with automatic retry

### **Error Handling**
- **API errors**: Detailed error messages and logging
- **Validation errors**: User-friendly error display
- **Network issues**: Graceful degradation and retry
- **Rate limit exceeded**: Automatic retry with exponential backoff

### **Response Processing**
```typescript
// Check for success indicators in the response
const isSuccess = response.ok && !data.isError && data.status === 201
const hasTrackingNumber = data.result?.link || data.tracking_number

return {
  success: isSuccess,
  tracking_number: hasTrackingNumber || order.id.toString(),
  message: data.message || 'Order sent successfully',
  status: data.status,
  isError: data.isError,
  result: data.result,
  error_message: isSuccess ? undefined : (data.message || 'Unknown error')
}
```

## 🔍 **Monitoring and Debugging**

### **API Status Monitoring**
- Real-time First Delivery API connection status
- Visual indicators (green wifi icon = connected, red wifi-off icon = disconnected)
- Hover tooltips showing connection details and error messages

### **Order Status Tracking**
- **Not sent**: Order is ready to be sent to First Delivery
- **Sent to First Delivery**: Order has been successfully sent
- **Failed**: Order failed to send (with error details)

### **Response Storage**
- All First Delivery API responses stored in `first_delivery_response` field
- Includes success/failure status, tracking numbers, and error messages
- Available for debugging and customer support

## 📈 **Performance Optimizations**

### **Bulk Operations**
- Send up to 100 orders at once - **NOW IMPLEMENTED**
- Automatic rate limiting compliance (10 seconds between requests)
- Efficient batch processing with single API call

### **Caching**
- Status caching to reduce API calls
- Connection status monitoring
- Response data storage

### **Async Processing**
- Non-blocking order operations
- Background status updates
- Real-time UI updates

---

**Status**: ✅ **COMPLETE** - First Delivery integration is fully implemented with comprehensive data flow analysis and optimization. 