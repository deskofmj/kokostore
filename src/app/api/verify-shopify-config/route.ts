import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN || 'NOT_SET',
      SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN ? 
        (process.env.SHOPIFY_ACCESS_TOKEN === 'your_access_token' ? 'PLACEHOLDER' : 'SET') : 'NOT_SET',
      SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Shopify configuration check completed',
      recommendations: config.SHOPIFY_ACCESS_TOKEN === 'PLACEHOLDER' ? 
        'You need to replace "your_access_token" with your actual Shopify access token' : 
        'Configuration looks good'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 