import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = getSupabaseClient()
    
    // Find orders that have nnclothingstore.com in their raw data
    const { data: ordersToDelete, error: fetchError } = await supabase
      .from('salmacollection')
      .select('id, name, raw')
      .not('raw', 'is', null)
    
    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: `Error fetching orders: ${fetchError.message}`
      }, { status: 500 })
    }

    const wrongStoreOrders = ordersToDelete?.filter(order => {
      const raw = order.raw as Record<string, unknown>
      return raw && (
        (typeof raw.referring_site === 'string' && raw.referring_site.includes('nnclothingstore')) ||
        (typeof raw.landing_site === 'string' && raw.landing_site.includes('nnclothingstore')) ||
        (typeof raw.source_url === 'string' && raw.source_url.includes('nnclothingstore'))
      )
    }) || []

    if (wrongStoreOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders from wrong store found',
        deletedCount: 0
      })
    }

    // Delete the wrong store orders
    const orderIds = wrongStoreOrders.map(order => order.id)
    const { error: deleteError } = await supabase
      .from('salmacollection')
      .delete()
      .in('id', orderIds)

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: `Error deleting orders: ${deleteError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${wrongStoreOrders.length} orders from wrong store`,
      deletedOrders: wrongStoreOrders.map(order => ({
        id: order.id,
        name: order.name
      })),
      deletedCount: wrongStoreOrders.length
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 