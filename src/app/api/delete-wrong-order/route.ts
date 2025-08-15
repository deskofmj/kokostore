import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = getSupabaseClient()
    
    // Delete the specific order from nnclothingstore
    const { error: deleteError } = await supabase
      .from('salmacollection')
      .delete()
      .eq('id', 6304664322114)

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: `Error deleting order: ${deleteError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully deleted order from nnclothingstore',
      deletedOrderId: 6304664322114
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 