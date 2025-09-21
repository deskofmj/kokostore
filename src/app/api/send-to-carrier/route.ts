import { NextRequest, NextResponse } from 'next/server'
import { getOrdersByIds, updateOrderStatus, clearUpdatedInShopifyFlag } from '@/lib/supabase'
import { sendOrderToFirstDelivery, sendBulkOrdersToFirstDelivery } from '@/lib/first-delivery'

export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json()
    
    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json(
        { error: 'Invalid order IDs provided' },
        { status: 400 }
      )
    }

    // Only fetch the specific orders we need instead of all orders
    const ordersToSend = await getOrdersByIds(orderIds)
    
    // Filter orders that can be sent (Not sent or Failed status)
    const eligibleOrders = ordersToSend.filter(order => 
      order.parcel_status === 'Not sent' || order.parcel_status === 'Failed'
    )
    
    const results = []
    
    // Handle orders that are already sent
    const alreadySentOrders = ordersToSend.filter(order => 
      order.parcel_status !== 'Not sent' && order.parcel_status !== 'Failed'
    )
    
    for (const order of alreadySentOrders) {
      results.push({
        orderId: order.id,
        success: false,
        error: `Order already ${order.parcel_status.toLowerCase()}`
      })
    }
    
    if (eligibleOrders.length === 0) {
      return NextResponse.json({
        success: true,
        results,
        summary: {
          total: results.length,
          successful: 0,
          failed: results.length
        }
      })
    }
    
    // Use bulk API for multiple orders, single API for one order
    if (eligibleOrders.length === 1) {
      // Single order - use individual API
      const order = eligibleOrders[0]
      try {
        const firstDeliveryResponse = await sendOrderToFirstDelivery(order)
        
        if (firstDeliveryResponse.success) {
          await updateOrderStatus(order.id, 'Sent to First Delivery', firstDeliveryResponse as unknown as Record<string, unknown>)
          // Clear the "Updated in Shopify" flag when order is sent to First Delivery
          await clearUpdatedInShopifyFlag(order.id)
          results.push({
            orderId: order.id,
            success: true,
            trackingNumber: firstDeliveryResponse.tracking_number
          })
        } else {
          await updateOrderStatus(order.id, 'Failed', firstDeliveryResponse as unknown as Record<string, unknown>)
          results.push({
            orderId: order.id,
            success: false,
            error: firstDeliveryResponse.error_message
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
      // Multiple orders - use bulk API
      try {
        const firstDeliveryResponse = await sendBulkOrdersToFirstDelivery(eligibleOrders)
        
        if (firstDeliveryResponse.success) {
          // Update all orders as sent successfully
          for (const order of eligibleOrders) {
            await updateOrderStatus(order.id, 'Sent to First Delivery', firstDeliveryResponse as unknown as Record<string, unknown>)
            // Clear the "Updated in Shopify" flag when order is sent to First Delivery
            await clearUpdatedInShopifyFlag(order.id)
            results.push({
              orderId: order.id,
              success: true,
              trackingNumber: firstDeliveryResponse.tracking_number || `bulk-${order.id}`
            })
          }
        } else {
          // Update all orders as failed
          for (const order of eligibleOrders) {
            await updateOrderStatus(order.id, 'Failed', firstDeliveryResponse as unknown as Record<string, unknown>)
            results.push({
              orderId: order.id,
              success: false,
              error: firstDeliveryResponse.error_message
            })
          }
        }
      } catch (error) {
        // Update all orders as failed due to exception
        for (const order of eligibleOrders) {
          await updateOrderStatus(order.id, 'Failed', { error: error instanceof Error ? error.message : 'Unknown error' })
          results.push({
            orderId: order.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
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