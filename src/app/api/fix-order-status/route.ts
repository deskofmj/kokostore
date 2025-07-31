import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = getSupabaseClient()
    
    // First, get all orders with non-standard status
    const { data: ordersToUpdate, error: fetchError } = await supabase
      .from('salmacollection')
      .select('id')
      .neq('parcel_status', 'Not sent')
      .neq('parcel_status', 'Sent to Droppex')
      .neq('parcel_status', 'Failed')

    if (fetchError) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch orders to update',
          details: fetchError.message
        },
        { status: 500 }
      )
    }

    // Update all orders with non-standard status to 'Not sent'
    const { error: updateError } = await supabase
      .from('salmacollection')
      .update({ parcel_status: 'Not sent' })
      .neq('parcel_status', 'Not sent')
      .neq('parcel_status', 'Sent to Droppex')
      .neq('parcel_status', 'Failed')

    if (updateError) {
      return NextResponse.json(
        { 
          error: 'Failed to update order status',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order statuses updated successfully',
      updatedCount: ordersToUpdate?.length || 0
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fix order status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 