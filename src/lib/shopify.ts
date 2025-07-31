import { Order } from './supabase'

// Only validate at runtime, not build time
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || ''
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || ''

export interface ShopifyOrder {
  id: number
  name: string
  email: string
  created_at: string
  total_price: string
  line_items: any[]
  shipping_address: any
  billing_address: any
  tags: string
  fulfillment_status: string
  financial_status: string
  note: string
  customer: any
}

export async function fetchShopifyOrders(): Promise<ShopifyOrder[]> {
  // Validate environment at runtime
  if (!process.env.SHOPIFY_DOMAIN || !process.env.SHOPIFY_ACCESS_TOKEN) {
    throw new Error('SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN environment variables are required')
  }

  const response = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2023-10/orders.json?status=any&limit=250`,
    {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.orders
}

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

export async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body, 'utf8')
  const calculatedSignature = 'sha256=' + hmac.digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  )
} 