import { NextResponse } from 'next/server'
import { getOrdersForDashboard } from '@/lib/supabase'

export async function GET() {
  try {
    const orders = await getOrdersForDashboard()
    
    return NextResponse.json({ 
      orders: orders,
      message: 'Orders loaded from database (webhook-only mode)'
    })
  } catch (error) {
    console.error('Error fetching orders from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders from database', orders: [] },
      { status: 500 }
    )
  }
} 