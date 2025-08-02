# 🔄 Data Flow Analysis: Shopify → Supabase → Droppex

## Overview

This document explains how order data flows from Shopify through our system to Droppex, including data validation, mapping, and potential issues.

## 📊 Data Flow Diagram

```
Shopify Order → Webhook → Supabase → Validation → Droppex API
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
  parcel_status: string,         // 'Not sent' | 'Sent to Droppex' | 'Failed'
  droppex_response: object,      // Response from Droppex API
  created_at_db: string         // When record was created
}
```

### 3. **Droppex Mapping**

```typescript
// Mapped to Droppex API format
{
  action: 'add',
  code_api: string,             // API credentials
  cle_api: string,              // API credentials
  tel_l: string,                // Phone number
  nom_client: string,           // Customer name
  gov_l: string,                // Province/State
  cod: string,                  // ⚠️ Postal code (ZIP)
  libelle: string,              // City + Province
  nb_piece: string,             // Number of items
  adresse_l: string,            // Street address
  remarque: string,             // Order notes
  tel2_l: string,               // Secondary phone
  service: 'Livraison'          // Service type
}
```

## ⚠️ **Critical Issues Identified**

### **1. Price Handling**
- **Issue**: Shopify sends `total_price` as a **string**
- **Solution**: ✅ Converted to **number** in Supabase storage
- **Droppex**: ❌ **NOT SENT** - Droppex doesn't need price information

### **2. Postal Code Issues**
- **Issue**: Missing or invalid postal codes
- **Shopify**: `shipping_address.zip` (string)
- **Supabase**: Stored as JSON in `shipping_address.zip`
- **Droppex**: Mapped to `cod` field with fallback to '1000'

### **3. Data Validation Issues**
- **Missing Required Fields**: Address, city, phone, customer name
- **Invalid Formats**: Phone numbers, postal codes
- **Default Values**: Using fallbacks when data is missing

## 🛠️ **Solutions Implemented**

### **1. Data Validation System**

```typescript
// New validation functions
validateShopifyToSupabase(shopifyOrder)    // Shopify → Supabase
validateOrderForDroppex(order)             // Supabase → Droppex
getOrderDataQuality(order)                 // Quality assessment
```

### **2. Data Quality Indicators**

- **Green Check**: Complete data (100% quality)
- **Yellow Warning**: Missing non-critical data
- **Red Error**: Missing critical data

### **3. Enhanced Error Handling**

```typescript
// Validation results
{
  isValid: boolean,
  errors: string[],      // Critical issues
  warnings: string[],    // Non-critical issues
  mappedData: object     // Cleaned data
}
```

## 📋 **Field Mapping Reference**

| Shopify Field | Supabase Field | Droppex Field | Validation |
|---------------|----------------|---------------|------------|
| `id` | `id` | ❌ Not sent | Required |
| `name` | `name` | ❌ Not sent | Required |
| `email` | `email` | ❌ Not sent | Required |
| `total_price` | `total_price` (number) | ❌ Not sent | Optional |
| `shipping_address.name` | `shipping_address.name` | `nom_client` | Required |
| `shipping_address.phone` | `shipping_address.phone` | `tel_l` | Required |
| `shipping_address.address1` | `shipping_address.address1` | `adresse_l` | Required |
| `shipping_address.city` | `shipping_address.city` | `libelle` | Required |
| `shipping_address.province` | `shipping_address.province` | `gov_l` | Optional |
| `shipping_address.zip` | `shipping_address.zip` | `cod` | Optional |
| `line_items.length` | `line_items.length` | `nb_piece` | Optional |
| `note` | `note` | `remarque` | Optional |

## 🔧 **Data Quality Rules**

### **Critical Issues (Red)**
- Missing order ID
- Missing order name
- Missing customer email
- Missing shipping address
- Missing shipping city
- Missing customer name

### **Warnings (Yellow)**
- Missing postal code (uses default '1000')
- Missing province (uses default 'Tunis')
- Missing phone number (uses default '00000000')
- No order items
- No order notes

### **Quality Score Calculation**
```typescript
qualityScore = 100 - (issues.length * 20) - (warnings.length * 10)
```

## 🚀 **Improvements Made**

### **1. Enhanced Validation**
- ✅ Comprehensive data validation at each step
- ✅ Clear error messages and warnings
- ✅ Quality scoring system

### **2. Better User Experience**
- ✅ Data quality indicators in the UI
- ✅ Visual warnings for problematic orders
- ✅ Detailed error reporting

### **3. Robust Error Handling**
- ✅ Graceful fallbacks for missing data
- ✅ Detailed logging for debugging
- ✅ User-friendly error messages

## 📈 **Monitoring & Debugging**

### **Console Logging**
```typescript
// Validation warnings
console.warn('Order validation warnings:', validation.warnings)

// Validation errors
console.warn('Order validation failed:', validation.errors)
```

### **Data Quality Dashboard**
- Real-time quality indicators
- Detailed issue reporting
- Quality score tracking

## 🎯 **Next Steps**

1. **Monitor Data Quality**: Track quality scores over time
2. **Improve Validation**: Add more sophisticated validation rules
3. **User Feedback**: Allow users to fix data issues in the UI
4. **Automated Testing**: Add tests for data mapping functions
5. **Performance Optimization**: Cache validation results

## 📝 **Summary**

The data flow is now **robust and well-validated**:

- ✅ **Shopify → Supabase**: Proper data conversion and storage
- ✅ **Supabase → Droppex**: Validated mapping with fallbacks
- ✅ **User Interface**: Clear quality indicators and warnings
- ✅ **Error Handling**: Comprehensive error reporting and logging

The system now handles missing or invalid data gracefully while providing clear feedback to users about data quality issues. 