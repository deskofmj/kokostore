import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
      SHOPIFY_WEBHOOK_SECRET_LENGTH: process.env.SHOPIFY_WEBHOOK_SECRET?.length || 0,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      MODE: 'WEBHOOK_ONLY'
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Webhook-only configuration check completed',
      recommendations: config.SHOPIFY_WEBHOOK_SECRET === 'SET' ? 
        'Webhook configuration looks good - only webhook secret is required' : 
        'SHOPIFY_WEBHOOK_SECRET is required for webhook signature verification'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 