import { NextRequest, NextResponse } from 'next/server'
import { getOrders, updateOrderStatus, clearUpdatedInShopifyFlag } from '@/lib/supabase'
import { sendOrderToDroppex } from '@/lib/droppex'

export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json()
    
    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json(
        { error: 'Invalid order IDs provided' },
        { status: 400 }
      )
    }

    const orders = await getOrders()
    const ordersToSend = orders.filter(order => orderIds.includes(order.id))
    
    const results = []
    
    for (const order of ordersToSend) {
      if (order.parcel_status === 'Not sent' || order.parcel_status === 'Failed') {
        try {
    
          const droppexResponse = await sendOrderToDroppex(order)
          
          
          if (droppexResponse.success) {
            await updateOrderStatus(order.id, 'Sent to Droppex', droppexResponse)
            // Clear the "Updated in Shopify" flag when order is sent to Droppex
            await clearUpdatedInShopifyFlag(order.id)
            results.push({
              orderId: order.id,
              success: true,
              trackingNumber: droppexResponse.tracking_number
            })
          } else {
            await updateOrderStatus(order.id, 'Failed', droppexResponse)
            results.push({
              orderId: order.id,
              success: false,
              error: droppexResponse.error_message
            })
          }
                  } catch (error) {
          await updateOrderStatus(order.id, 'Failed', { error: error instanceof Error ? error.message : 'Unknown error' })
          results.push({
            orderId: order.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      } else {
        results.push({
          orderId: order.id,
          success: false,
          error: `Order already ${order.parcel_status.toLowerCase()}`
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount
    
    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    })
  } catch (error) {
    console.error('Error sending orders to carrier:', error)
    return NextResponse.json(
      { error: 'Failed to send orders to carrier' },
      { status: 500 }
    )
  }
} 