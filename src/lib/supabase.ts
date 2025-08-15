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
  parcel_status: 'Not sent' | 'Sent to Droppex' | 'Failed'
  droppex_response?: Record<string, unknown> | null
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

export async function getOrders() {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('salmacollection')
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
      if (status === 'Not sent' || status === 'Sent to Droppex' || status === 'Failed') {
        return status
      }
      return 'Not sent'
    })(),
    droppex_response: item.droppex_response || null,
    created_at_db: item.created_at_db || new Date().toISOString(),
    updated_at: item.updated_at || null,
    updated_in_shopify: item.updated_in_shopify || false,
    // Additional fields for cross-platform compatibility
    raw: item.raw || null,
    shop_domain: item.shop_domain || null
  }))

  return mappedData as Order[]
}

export async function updateOrderStatus(orderId: number, status: Order['parcel_status'], droppexResponse?: Record<string, unknown>) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('salmacollection')
    .update({ 
      parcel_status: status,
      droppex_response: droppexResponse || null
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Error updating order: ${error.message}`)
  }
}

export async function insertOrder(order: Omit<Order, 'parcel_status' | 'created_at_db'>) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('salmacollection')
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
    .from('salmacollection')
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
    .from('salmacollection')
    .update({
      updated_in_shopify: false
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(`Error clearing updated flag: ${error.message}`)
  }
} 