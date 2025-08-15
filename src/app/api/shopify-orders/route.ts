import { NextResponse } from 'next/server'
import { getOrders } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Fetching orders from database...')
    const orders = await getOrders()
    console.log('Orders fetched:', orders.length)
    
    return NextResponse.json({ 
      orders: orders,
      message: 'Orders loaded from database (webhook-only mode)',
      debug: {
        totalOrders: orders.length,
        orders: orders.map(o => ({ id: o.id, name: o.name, status: o.parcel_status }))
      }
    })
  } catch (error) {
    console.error('Error fetching orders from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders from database', orders: [] },
      { status: 500 }
    )
  }
} 