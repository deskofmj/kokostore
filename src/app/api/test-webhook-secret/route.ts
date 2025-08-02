import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET

    const result: any = {
      bodyLength: body.length,
      signaturePresent: !!signature,
      webhookSecretPresent: !!webhookSecret,
      webhookSecretLength: webhookSecret?.length || 0,
      bodyPreview: body.substring(0, 100) + '...'
    }

    if (signature && webhookSecret) {
      try {
        const isValid = await verifyWebhookSignature(body, signature, webhookSecret)
        result.signatureValid = isValid
      } catch (error) {
        result.signatureError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 