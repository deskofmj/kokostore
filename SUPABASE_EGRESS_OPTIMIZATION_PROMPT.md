# 🚨 Supabase Egress Optimization Prompt

## **Context**
I'm experiencing high Supabase egress usage that's likely exceeding my plan limits. Please examine my project and identify the root causes of excessive database queries and data transfer, then implement optimizations to reduce egress usage by 70-85%.

## **What to Look For**

### 🔍 **Critical Issues to Identify**

1. **Inefficient Order/Record Existence Checks**
   - Look for patterns like: `getAllRecords()` then `.filter()` or `.find()`
   - Check webhook handlers that fetch all data just to check if one record exists
   - **Impact**: This is usually the #1 cause of excessive egress

2. **Unnecessary Full Data Fetches**
   - Find `SELECT *` queries when only specific fields are needed
   - Look for API endpoints that fetch complete records for simple operations
   - Check dashboard/listing endpoints that load heavy JSONB fields unnecessarily

3. **Redundant Database Calls**
   - Identify multiple calls to the same endpoint without caching
   - Look for operations that fetch all records then filter client-side
   - Check for missing targeted queries (fetching by IDs)

4. **Missing Database Indexes**
   - Check if common query patterns have proper indexes
   - Look for slow queries that could benefit from indexing

5. **No Caching Strategy**
   - Identify repeated API calls for the same data
   - Look for client-side code that doesn't cache responses

## **Specific Patterns to Search For**

### **In API Routes:**
```typescript
// ❌ BAD - Fetches all records to check existence
const allRecords = await getAllRecords()
const exists = allRecords.some(record => record.id === targetId)

// ❌ BAD - Fetches all records then filters
const allRecords = await getAllRecords()
const filtered = allRecords.filter(record => ids.includes(record.id))

// ❌ BAD - Uses SELECT * when only specific fields needed
const { data } = await supabase.from('table').select('*')
```

### **In Webhook Handlers:**
```typescript
// ❌ BAD - Common webhook anti-pattern
const existingRecords = await getAllRecords()
const recordExists = existingRecords.some(record => record.id === webhookData.id)
```

### **In Dashboard/Listing Components:**
```typescript
// ❌ BAD - Fetches full data for simple listings
const records = await getFullRecords() // Includes heavy JSONB fields
```

## **Optimization Solutions to Implement**

### **1. Fix Existence Checks (Highest Priority)**
```typescript
// ✅ GOOD - Targeted existence check
export async function recordExists(id: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('table')
    .select('id')
    .eq('id', id)
    .limit(1)
    .single()
  
  if (error?.code === 'PGRST116') return false
  return !!data
}
```

### **2. Implement Selective Field Queries**
```typescript
// ✅ GOOD - Dashboard optimized query
export async function getRecordsForDashboard() {
  return await supabase
    .from('table')
    .select('id, name, status, created_at') // Only needed fields
    .order('created_at', { ascending: false })
}

// ✅ GOOD - Targeted queries by IDs
export async function getRecordsByIds(ids: number[]) {
  return await supabase
    .from('table')
    .select('*')
    .in('id', ids)
}
```

### **3. Add Database Indexes**
```sql
-- Essential indexes for common patterns
CREATE INDEX IF NOT EXISTS idx_table_id ON table_name(id);
CREATE INDEX IF NOT EXISTS idx_table_status ON table_name(status);
CREATE INDEX IF NOT EXISTS idx_table_created_at ON table_name(created_at);
CREATE INDEX IF NOT EXISTS idx_table_status_created ON table_name(status, created_at DESC);
```

### **4. Implement Client-Side Caching**
```typescript
// ✅ GOOD - Smart caching
const fetchData = async (forceRefresh = false) => {
  if (!forceRefresh && data.length > 0 && !loading) {
    return // Use cached data
  }
  // Fetch new data
}
```

## **Files to Examine**

1. **API Routes** (`/api/` directory)
   - Webhook handlers
   - CRUD operations
   - Dashboard data endpoints

2. **Database Functions** (`/lib/` or `/utils/`)
   - Supabase query functions
   - Data fetching utilities

3. **Frontend Hooks/Components**
   - Data fetching hooks
   - Dashboard components
   - List/table components

4. **Database Schema**
   - Check for missing indexes
   - Identify large JSONB fields

## **Expected Deliverables**

1. **Analysis Report**: Identify specific egress issues found
2. **Code Fixes**: Implement all optimizations
3. **Database Script**: Create index optimization SQL
4. **Summary Document**: List all changes and expected impact

## **Success Metrics**

- **Target**: 70-85% reduction in Supabase egress usage
- **Priority Order**: Webhook fixes > Selective queries > Caching > Indexes
- **Verification**: Monitor Supabase dashboard after deployment

## **Common Project Types to Focus On**

- **E-commerce/Shopify integrations** (like Koko Store)
- **Order management systems**
- **Dashboard applications**
- **Webhook-heavy applications**
- **Any app using Supabase with JSONB fields**

---

**Please examine my project thoroughly and implement these optimizations. The webhook existence check fix alone typically provides the biggest impact.**
