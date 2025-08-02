import { NextRequest, NextResponse } from 'next/server'
import { updateOrderStatus, clearUpdatedInShopifyFlag } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Revert order status to 'Not sent'
    await updateOrderStatus(orderId, 'Not sent')
    
    // Clear the "Updated in Shopify" flag when order is reverted
    await clearUpdatedInShopifyFlag(orderId)
    
    return NextResponse.json({ 
      success: true,
      message: 'Order status reverted successfully'
    })
  } catch (error) {
    console.error('Error reverting order:', error)
    return NextResponse.json(
      { error: 'Failed to revert order status' },
      { status: 500 }
    )
  }
} 