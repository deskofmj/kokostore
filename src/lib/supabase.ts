import { createClient } from '@supabase/supabase-js'

export interface Order {
  id: number
  name: string
  email: string
  created_at: string
  total_price: number
  line_items: Record<string, unknown>[]
  shipping_address: Record<string, unknown> | null
  billing_address: Record<string, unknown> | null
  tags: string
  fulfillment_status: string
  financial_status: string
  note: string
  customer: Record<string, unknown> | null
  parcel_status: 'Not sent' | 'Sent to First Delivery' | 'Failed'
  first_delivery_response?: Record<string, unknown> | null
  created_at_db?: string
  updated_at?: string
  updated_in_shopify?: boolean
  // Additional fields for cross-platform compatibility
  raw?: Record<string, unknown> | null
  shop_domain?: string | null
}

// Lazy initialization of Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required')
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)
  }
  
  return supabaseClient
}

// Optimized function for dashboard listing - only fetch essential fields
export async function getOrdersForDashboard() {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('kokostore_orders')
    .select('id, name, email, created_at, total_price, parcel_status, created_at_db, shipping_address, customer')
    .order('created_at_db', { ascending: false })

  if (error) {
    throw new Error(`Error fetching orders: ${error.message}`)
  }

  // Map the database data to the expected Order interface
  const mappedData = (data || []).map((item: Record<string, unknown>) => ({
    id: item.id,
    name: item.name || `Order #${item.id}`,
    email: item.email || '',
    created_at: item.created_at || item.created_at_db || new Date().toISOString(),
    total_price: item.total_price || 0,
    line_items: [], // Empty for dashboard - not needed
    shipping_address: item.shipping_address || null,
    billing_address: null, // Not needed for dashboard
    tags: '', // Not needed for dashboard
    fulfillment_status: 'unfulfilled', // Default value
    financial_status: 'paid', // Default value
    note: '', // Not needed for dashboard
    customer: item.customer || null,
    parcel_status: (() => {
      const status = item.parcel_status || 'Not sent'
      // Map any non-standard status to 'Not sent'
      if (status === 'Not sent' || status === 'Sent to First Delivery' || status === 'Failed') {
        return status
      }
      return 'Not sent'
    })(),
    first_delivery_response: null, // Not needed for dashboard
    created_at_db: item.created_at_db || new Date().toISOString(),
    updated_at: null, // Not needed for dashboard
    updated_in_shopify: false, // Not needed for dashboard
    // Additional fields for cross-platform compatibility
    raw: null, // Not needed for dashboard
    shop_domain: null // Not needed for dashboard
  }))

  return mappedData as Order[]
}

// Full function for when complete order data is needed
export async function getOrders() {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('kokostore_orders')
    .select('*')
    .order('created_at_db', { ascending: false })

  if (error) {
    throw new Error(`Error fetching orders: ${error.message}`)
  }

  // Map the database data to the expected Order interface
  const mappedData = (data || []).map((item: Record<string, unknown>) => ({
    id: item.id,
    name: item.name || `Order #${item.id}`,
    email: item.email || '',
    created_at: item.created_at || item.created_at_db || new Date().toISOString(),
    total_price: item.total_price || 0,
    line_items: Array.isArray(item.line_items) ? item.line_items : [],
    shipping_address: item.shipping_address || null,
    billing_address: item.billing_address || null,
    tags: item.tags || '',
    fulfillment_status: item.fulfillment_status || 'unfulfilled',
    financial_status: item.financial_status || 'paid',
    note: item.note || '',
    customer: item.customer || null,
    parcel_status: (() => {
      const status = item.parcel_status || 'Not sent'
      // Map any non-standard status to 'Not sent'
      if (status === 'Not sent' || status === 'Sent to First Delivery' || status === 'Failed') {
        return status
      }
      return 'Not sent'
    })(),
    first_delivery_response: item.first_delivery_response || null,
    created_at_db: item.created_at_db || new Date().toISOString(),
    updated_at: item.updated_at || null,
    updated_in_shopify: item.updated_in_shopify || false,
    // Additional fields for cross-platform compatibility
    raw: item.raw || null,
    shop_domain: item.shop_domain || null
  }))

  return mappedData as Order[]
}

// Function to get specific orders by IDs (for send-to-carrier)
export async function getOrdersByIds(orderIds: number[]) {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('kokostore_orders')
    .select('*')
    .in('id', orderIds)
    .order('created_at_db', { ascending: false })

  if (error) {
    throw new Error(`Error fetching orders: ${error.message}`)
  }

  // Map the database data to the expected Order interface
  const mappedData = (data || []).map((item: Record<string, unknown>) => ({
    id: item.id,
    name: item.name || `Order #${item.id}`,
    email: item.email || '',
    created_at: item.created_at || item.created_at_db || new Date().toISOString(),
    total_price: item.total_price || 0,
    line_items: Array.isArray(item.line_items) ? item.line_items : [],
    shipping_address: item.shipping_address || null,
    billing_address: item.billing_address || null,
    tags: item.tags || '',
    fulfillment_status: item.fulfillment_status || 'unfulfilled',
    financial_status: item.financial_status || 'paid',
    note: item.note || '',
    customer: item.customer || null,
    parcel_status: (() => {
      const status = item.parcel_status || 'Not sent'
      // Map any non-standard status to 'Not sent'
      if (status === 'Not sent' || status === 'Sent to First Delivery' || status === 'Failed') {
        return status
      }
      return 'Not sent'
    })(),
    first_delivery_response: item.first_delivery_response || null,
    created_at_db: item.created_at_db || new Date().toISOString(),
    updated_at: item.updated_at || null,
    updated_in_shopify: item.updated_in_shopify || false,
    // Additional fields for cross-platform compatibility
    raw: item.raw || null,
    shop_domain: item.shop_domain || null
  }))

  return mappedData as Order[]
}

export async function updateOrderStatus(orderId: number, status: Order['parcel_status'], firstDeliveryResponse?: Record<string, unknown>) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('kokostore_orders')
    .update({ 
      parcel_status: status,
      first_delivery_response: firstDeliveryResponse || null
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Error updating order: ${error.message}`)
  }
}

export async function insertOrder(order: Omit<Order, 'parcel_status' | 'created_at_db'>) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('kokostore_orders')
    .insert({
      ...order,
      parcel_status: 'Not sent',
      created_at_db: new Date().toISOString()
    })

  if (error) {
    throw new Error(`Error inserting order: ${error.message}`)
  }
}

export async function updateOrder(order: Omit<Order, 'parcel_status' | 'created_at_db'>, updatedAt: string) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('kokostore_orders')
    .update({
      ...order,
      updated_at: updatedAt,
      updated_in_shopify: true
    })
    .eq('id', order.id)

  if (error) {
    throw new Error(`Error updating order: ${error.message}`)
  }
}

export async function clearUpdatedInShopifyFlag(orderId: number) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('kokostore_orders')
    .update({
      updated_in_shopify: false
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Error clearing updated flag: ${error.message}`)
  }
}

export async function orderExists(orderId: number): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('kokostore_orders')
    .select('id')
    .eq('id', orderId)
    .limit(1)
    .single()

  if (error) {
    // If error is "PGRST116" (no rows returned), order doesn't exist
    if (error.code === 'PGRST116') {
      return false
    }
    throw new Error(`Error checking order existence: ${error.message}`)
  }

  return !!data
}

export async function deleteOrders(orderIds: number[]) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('kokostore_orders')
    .delete()
    .in('id', orderIds)

  if (error) {
    throw new Error(`Error deleting orders: ${error.message}`)
  }
} 