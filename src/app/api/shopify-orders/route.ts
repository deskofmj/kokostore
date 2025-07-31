import { NextRequest, NextResponse } from 'next/server'
import { fetchShopifyOrders, mapShopifyOrderToOrder } from '@/lib/shopify'
import { getOrders, insertOrder } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Fetching orders from database...')
    const existingOrders = await getOrders()
    console.log('Orders fetched:', existingOrders.length)
    
    // Check if Shopify credentials are configured
    if (!process.env.SHOPIFY_DOMAIN || !process.env.SHOPIFY_ACCESS_TOKEN) {
      // Return existing orders from database only
      return NextResponse.json({ 
        orders: existingOrders,
        newOrdersCount: 0,
        message: 'Shopify credentials not configured. Showing existing orders only.',
        debug: {
          totalOrders: existingOrders.length,
          orders: existingOrders.map(o => ({ id: o.id, name: o.name, status: o.parcel_status }))
        }
      })
    }

    // Fetch orders from Shopify
    const shopifyOrders = await fetchShopifyOrders()
    
    // Get existing orders from database (already fetched above)
    const existingOrderIds = new Set(existingOrders.map(order => order.id))
    
    // Filter out orders that already exist in database
    const newOrders = shopifyOrders.filter(order => !existingOrderIds.has(order.id))
    
    // Insert new orders into database
    for (const shopifyOrder of newOrders) {
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await insertOrder(order)
    }
    
    // Return all orders from database
    const allOrders = await getOrders()
    
    return NextResponse.json({ 
      orders: allOrders,
      newOrdersCount: newOrders.length 
    })
  } catch (error) {
    console.error('Error fetching Shopify orders:', error)
    
    // If Shopify API fails, still return existing orders from database
    try {
      const fallbackOrders = await getOrders()
      return NextResponse.json({ 
        orders: fallbackOrders,
        newOrdersCount: 0,
        error: 'Shopify API error, showing existing orders only'
      })
    } catch (dbError) {
      return NextResponse.json(
        { error: 'Failed to fetch orders', orders: [] },
        { status: 500 }
      )
    }
  }
} 