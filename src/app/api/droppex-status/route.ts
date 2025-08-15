import { NextResponse } from 'next/server'

// Droppex API Configuration
const DROPPEX_CONFIG = {
  dev: {
    url: process.env.DROPPEX_DEV_URL || 'https://apidev.droppex.delivery/api_droppex_post',
    code_api: process.env.DROPPEX_DEV_CODE_API || '582',
    cle_api: process.env.DROPPEX_DEV_CLE_API || '5VnhlnchEpIglis9nBra'
  },
  prod: {
    url: process.env.DROPPEX_PROD_URL || 'https://droppex.delivery/api_droppex_post',
    code_api: process.env.DROPPEX_PROD_CODE_API || '1044',
    cle_api: process.env.DROPPEX_PROD_CLE_API || 'LEyMmMrLtmva65it2dOU'
  }
}

async function testDroppexConnection(config: Record<string, string>, envName: string) {
  try {
    const formData = new URLSearchParams({
      action: 'list',
      code_api: config.code_api,
      cle_api: config.cle_api
    })

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.text()
    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(data)
    } catch {
      parsedData = { message: data }
    }

    return {
      environment: envName,
      connected: response.ok && (parsedData.reference || parsedData.message),
      error: response.ok ? undefined : parsedData.message || `HTTP ${response.status}`
    }
  } catch (error) {
    return {
      environment: envName,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function GET() {
  try {
    // Test both environments
    const devStatus = await testDroppexConnection(DROPPEX_CONFIG.dev, 'dev')
    const prodStatus = await testDroppexConnection(DROPPEX_CONFIG.prod, 'prod')
    
    return NextResponse.json({
      dev: devStatus,
      prod: prodStatus,
      current: process.env.NODE_ENV === 'development' ? devStatus : prodStatus
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to check Droppex status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 