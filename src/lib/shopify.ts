import { Order } from './supabase'

// Webhook-only mode - no API access token needed
export interface ShopifyOrder {
  id: number
  name: string
  email: string
  created_at: string
  total_price: string
  line_items: Record<string, unknown>[]
  shipping_address: Record<string, unknown> | null
  billing_address: Record<string, unknown> | null
  tags: string
  fulfillment_status: string
  financial_status: string
  note: string
  customer: Record<string, unknown> | null
}

/**
 * Maps Shopify webhook order data to our database format
 * This function processes data received from Shopify webhooks only
 */
export function mapShopifyOrderToOrder(shopifyOrder: ShopifyOrder): Omit<Order, 'parcel_status' | 'created_at_db'> {
  return {
    id: shopifyOrder.id,
    name: shopifyOrder.name,
    email: shopifyOrder.email,
    created_at: shopifyOrder.created_at,
    total_price: parseFloat(shopifyOrder.total_price),
    line_items: shopifyOrder.line_items,
    shipping_address: shopifyOrder.shipping_address,
    billing_address: shopifyOrder.billing_address,
    tags: shopifyOrder.tags,
    fulfillment_status: shopifyOrder.fulfillment_status,
    financial_status: shopifyOrder.financial_status,
    note: shopifyOrder.note,
    customer: shopifyOrder.customer,
  }
}

/**
 * Verifies Shopify webhook signature using webhook secret
 * This is the only authentication method we use - no API access token needed
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const crypto = await import('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body, 'utf8')
  const calculatedSignature = 'sha256=' + hmac.digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  )
} 