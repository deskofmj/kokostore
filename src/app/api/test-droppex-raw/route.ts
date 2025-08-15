import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Test with the same data as your curl test
    const testData = {
      action: 'add',
      code_api: '1044',
      cle_api: 'LEyMmMrLtmva65it2dOU',
      tel_l: '5551234567',
      nom_client: 'John Smith',
      gov_l: 'Tunis',
      cod: '1000',
      libelle: 'Tunis Tunis',
      nb_piece: '2',
      adresse_l: '123 Main Street',
      remarque: `Order: #${orderId}`,
      tel2_l: '5551234567',
      service: 'Livraison'
    }

    const formData = new URLSearchParams()
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value.toString())
    })

    console.log('Sending test request to Droppex:', {
      url: 'https://droppex.delivery/api_droppex_post',
      data: testData,
      formData: formData.toString()
    })

    const response = await fetch('https://droppex.delivery/api_droppex_post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.text()
    console.log(`Raw Droppex response (${response.status}):`, data)
    
    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(data)
    } catch {
      parsedData = { message: data }
    }

    return NextResponse.json({
      success: true,
      request: testData,
      response: {
        status: response.status,
        ok: response.ok,
        raw: data,
        parsed: parsedData
      }
    })
  } catch (error) {
    console.error('Error testing Droppex raw:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test Droppex raw',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 