import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { orders } = await request.json()
    
    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { error: 'Invalid orders data provided' },
        { status: 400 }
      )
    }

    const results = []
    
    for (const order of orders) {
      try {
        const { error } = await supabase
          .from('salmacollection')
          .update({
            customer: order.customer,
            shipping_address: order.shipping_address,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)

        if (error) {
          results.push({
            orderId: order.id,
            success: false,
            error: error.message
          })
        } else {
          results.push({
            orderId: order.id,
            success: true
          })
        }
      } catch (error) {
        results.push({
          orderId: order.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
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
    console.error('Error updating orders:', error)
    return NextResponse.json(
      { error: 'Failed to update orders' },
      { status: 500 }
    )
  }
} 