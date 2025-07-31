import { Order } from './supabase'

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

// Use environment to determine which config to use
const isDev = process.env.NODE_ENV === 'development'
const config = isDev ? DROPPEX_CONFIG.dev : DROPPEX_CONFIG.prod

export interface DroppexPackage {
  action: string
  code_api: string
  cle_api: string
  tel_l: string
  nom_client: string
  gov_l: string
  cod: string
  libelle: string
  nb_piece: string
  adresse_l: string
  remarque?: string
  tel2_l?: string
  service: string
}

export interface DroppexResponse {
  success: boolean
  tracking_number?: string
  error_message?: string
  code_barre?: string
  message?: string
}

export async function sendOrderToDroppex(order: Order): Promise<DroppexResponse> {
  try {
    const droppexPackage = mapOrderToDroppexFormat(order)
    
    // Convert to URL-encoded form data
    const formData = new URLSearchParams()
    Object.entries(droppexPackage).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.text()
    
    // Try to parse as JSON, but handle text responses too
    let parsedData: any
    try {
      parsedData = JSON.parse(data)
    } catch {
      parsedData = { message: data }
    }

    if (!response.ok) {
      return {
        success: false,
        error_message: parsedData.message || `HTTP ${response.status}`,
      }
    }

    // Check for success indicators in the response
    const isSuccess = parsedData.success || 
                     parsedData.code_barre || 
                     parsedData.message?.toLowerCase().includes('success') ||
                     response.status === 200

    return {
      success: isSuccess,
      tracking_number: parsedData.code_barre,
      code_barre: parsedData.code_barre,
      message: parsedData.message,
      error_message: isSuccess ? undefined : parsedData.message || 'Unknown error'
    }
  } catch (error) {
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function mapOrderToDroppexFormat(order: Order): DroppexPackage {
  // Extract customer information
  const customerName = order.shipping_address?.name || 
                      `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() ||
                      'Unknown Customer'
  
  const phone = order.shipping_address?.phone || 
                order.customer?.phone || 
                '00000000' // Default phone if none provided
  
  const address = order.shipping_address?.address1 || ''
  const city = order.shipping_address?.city || ''
  const province = order.shipping_address?.province || ''
  const zipCode = order.shipping_address?.zip || ''
  
  // Map to Droppex format
  return {
    action: 'add',
    code_api: config.code_api,
    cle_api: config.cle_api,
    tel_l: phone,
    nom_client: customerName,
    gov_l: province || 'Tunis', // Default to Tunis if no province
    cod: zipCode || '1000', // Default postal code
    libelle: `${city} ${province}`.trim() || 'Tunis',
    nb_piece: order.line_items.length.toString(),
    adresse_l: address,
    remarque: order.note || `Order: ${order.name}`,
    tel2_l: phone, // Same as primary phone
    service: 'Livraison' // Always "Livraison" for delivery
  }
}

// Additional functions for other Droppex operations
export async function getDroppexPackage(codeBarre: string): Promise<DroppexResponse> {
  try {
    const formData = new URLSearchParams({
      action: 'get',
      code_api: config.code_api,
      cle_api: config.cle_api,
      code_barre: codeBarre
    })

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.text()
    let parsedData: any
    try {
      parsedData = JSON.parse(data)
    } catch {
      parsedData = { message: data }
    }

    return {
      success: response.ok,
      tracking_number: parsedData.code_barre,
      message: parsedData.message,
      error_message: response.ok ? undefined : parsedData.message
    }
  } catch (error) {
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function listDroppexPackages(): Promise<DroppexResponse> {
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
    let parsedData: any
    try {
      parsedData = JSON.parse(data)
    } catch {
      parsedData = { message: data }
    }

    return {
      success: response.ok,
      message: parsedData.message,
      error_message: response.ok ? undefined : parsedData.message
    }
  } catch (error) {
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
} 