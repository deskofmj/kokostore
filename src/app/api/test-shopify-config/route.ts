import { NextResponse } from 'next/server'
import { fetchShopifyOrders } from '@/lib/shopify'

export async function GET() {
  try {
    const config = {
      SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN || 'NOT_SET',
      SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN ? 'SET' : 'NOT_SET',
      SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV
    }

    // Test Shopify API connection
    let shopifyTest: Record<string, unknown> = { success: false, error: 'Not tested' }
    try {
      const orders = await fetchShopifyOrders()
      shopifyTest = { 
        success: true, 
        orderCount: orders.length,
        firstOrder: orders[0] ? orders[0].name : null
      }
    } catch (error) {
      shopifyTest = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }

    return NextResponse.json({
      success: true,
      config,
      shopifyTest,
      message: 'Configuration test completed'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 