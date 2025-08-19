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
// Using PRODUCTION environment only - this ensures all operations use the live Droppex API
const isDev = false // Always use production environment
export const config = isDev ? DROPPEX_CONFIG.dev : DROPPEX_CONFIG.prod

export interface DroppexPackage {
  action: string
  code_api: string
  cle_api: string
  tel_l: string
  nom_client: string
  gov_l: string
  cp_l: string  // Postal code field
  cod: string   // Price field (total_price)
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
    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(data)
    } catch {
      parsedData = { message: data }
    }

    // Check for success indicators in the response
    // Based on actual API response: {"reference": 61934246738, "url": "...", "message": "..."}
    const hasReference = !!parsedData.reference
    const hasCodeBarre = !!parsedData.code_barre
    const hasSuccessMessage = (parsedData.message as string)?.toLowerCase().includes('success')
    const hasError = parsedData.error || (parsedData.message as string)?.toLowerCase().includes('error')
    const isSuccess = (hasReference || hasCodeBarre || hasSuccessMessage) && !hasError

    return {
      success: isSuccess,
      tracking_number: (parsedData.reference?.toString() as string) || (parsedData.code_barre as string),
      code_barre: (parsedData.reference?.toString() as string) || (parsedData.code_barre as string),
      message: parsedData.message as string,
      error_message: isSuccess ? undefined : (parsedData.message as string) || 'Unknown error'
    }
  } catch (error) {
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

import { validateOrderForDroppex } from './data-mapping'

export function mapOrderToDroppexFormat(order: Order): DroppexPackage {
  // Use the validation function to get properly mapped data
  const validation = validateOrderForDroppex(order)
  
  if (!validation.isValid) {
    console.warn('Order validation failed:', validation.errors)
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Order validation warnings:', validation.warnings)
  }
  
  // Add detailed logging for debugging postal code and price issues
  // console.log('Droppex mapping debug:', {
  //   orderId: order.id,
  //   postalCode: order.shipping_address?.zip,
  //   mappedPostalCode: validation.mappedData.cp_l,
  //   price: order.total_price,
  //   mappedPrice: validation.mappedData.cod,
  //   customerName: validation.mappedData.nom_client,
  //   address: validation.mappedData.adresse_l,
  //   governorate: validation.mappedData.gov_l
  // })
  
  // Return the validated and mapped data
  return {
    action: 'add',
    code_api: config.code_api,
    cle_api: config.cle_api,
    ...validation.mappedData
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
    
    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(data)
    } catch {
      parsedData = { message: data }
    }

    // Check if package actually exists
    const hasPackageData = parsedData.code_barre || parsedData.reference || parsedData.nom_livraison || parsedData.dernier_etat
    const hasError = parsedData.error || parsedData.message?.toLowerCase().includes('pas trouvé') || parsedData.message?.toLowerCase().includes('not found')
    
    const isSuccess = hasPackageData && !hasError

    return {
      success: isSuccess,
      tracking_number: parsedData.code_barre || parsedData.reference || codeBarre, // Use original code if not in response
      message: parsedData.message || parsedData.dernier_etat,
      error_message: isSuccess ? undefined : parsedData.message || 'Package not found'
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
    let parsedData: Record<string, unknown>
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