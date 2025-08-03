import { NextRequest, NextResponse } from 'next/server'
import { getOrders } from '@/lib/supabase'
import { mapOrderToDroppexFormat } from '@/lib/droppex'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    if (!orderId) {
      return NextResponse.json({ 
        error: 'orderId parameter is required' 
      }, { status: 400 })
    }

    const orders = await getOrders()
    const order = orders.find(o => o.id.toString() === orderId)
    
    if (!order) {
      return NextResponse.json({ 
        error: `Order ${orderId} not found` 
      }, { status: 404 })
    }

    // Test the Droppex mapping
    const droppexPackage = mapOrderToDroppexFormat(order)
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        name: order.name,
        total_price: order.total_price,
        shipping_address: {
          zip: order.shipping_address?.zip,
          city: order.shipping_address?.city,
          province: order.shipping_address?.province,
          address1: order.shipping_address?.address1,
          name: order.shipping_address?.name,
          phone: order.shipping_address?.phone
        },
        customer: {
          first_name: order.customer?.first_name,
          last_name: order.customer?.last_name,
          phone: order.customer?.phone
        }
      },
      droppexMapping: droppexPackage,
      fieldAnalysis: {
        postalCode: {
          original: order.shipping_address?.zip,
          mapped: droppexPackage.cp_l,
          isValid: /^\d{4,5}$/.test(droppexPackage.cp_l)
        },
        price: {
          original: order.total_price,
          mapped: droppexPackage.cod,
          isValid: !isNaN(parseFloat(droppexPackage.cod || '0'))
        },
        customerName: {
          original: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
          mapped: droppexPackage.nom_client,
          isValid: !!droppexPackage.nom_client && droppexPackage.nom_client !== ''
        },
        governorate: {
          original: order.shipping_address?.province,
          mapped: droppexPackage.gov_l,
          isValid: !isNaN(parseInt(droppexPackage.gov_l))
        }
      }
    })
  } catch (error) {
    console.error('Test Droppex mapping error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 