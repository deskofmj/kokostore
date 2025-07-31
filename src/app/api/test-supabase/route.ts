import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    // Test the connection by fetching all data from the table
    const { data, error, count } = await supabase
      .from('salmacollection')
      .select('*', { count: 'exact' })
      .order('created_at_db', { ascending: false })

    if (error) {
      return NextResponse.json(
        { 
          error: 'Supabase connection failed',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: data || [],
      count: count || 0,
      tableName: 'salmacollection'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to test Supabase connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 