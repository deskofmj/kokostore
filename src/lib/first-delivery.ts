import { Order } from './supabase'

// First Delivery API Configuration
const FIRST_DELIVERY_CONFIG = {
  baseUrl: process.env.FIRST_DELIVERY_BASE_URL || 'https://api.firstdelivery.com',
  token: process.env.FIRST_DELIVERY_TOKEN || '',
  rateLimit: {
    singleOrder: 10000, // 10 seconds between requests (as per First Delivery API docs)
    bulkOrders: 10000   // 10 seconds between requests (as per First Delivery API docs)
  }
}

export interface FirstDeliveryClient {
  nom: string
  gouvernerat: string
  ville: string
  adresse: string
  telephone: string
  telephone2?: string
}

export interface FirstDeliveryProduct {
  article: string
  prix: number
  designation: string
  nombreArticle: number
  commentaire: string
  nombreEchange?: number
}

export interface FirstDeliveryOrder {
  Client: FirstDeliveryClient
  Produit: FirstDeliveryProduct
}

// New interfaces for bulk orders (without nombreEchange field)
export interface FirstDeliveryBulkProduct {
  article: string
  prix: number
  designation: string
  nombreArticle: number
  commentaire: string
  // nombreEchange is NOT included for bulk API
}

export interface FirstDeliveryBulkOrder {
  Client: FirstDeliveryClient
  Produit: FirstDeliveryBulkProduct
}

export interface FirstDeliveryResponse {
  success: boolean
  tracking_number?: string
  error_message?: string
  message?: string
  status?: number
  isError?: boolean
  result?: Record<string, unknown>
  errors?: Array<{
    path: string
    message: string
  }>
}

export interface FirstDeliveryStatusResponse {
  success: boolean
  status?: string
  error_message?: string
  message?: string
}

// Rate limiting helper
let lastSingleOrderRequest = 0
let lastBulkOrderRequest = 0

function checkRateLimit(type: 'single' | 'bulk'): boolean {
  const now = Date.now()
  
  if (type === 'single') {
    if (now - lastSingleOrderRequest < FIRST_DELIVERY_CONFIG.rateLimit.singleOrder) {
      return false
    }
    lastSingleOrderRequest = now
  } else {
    if (now - lastBulkOrderRequest < FIRST_DELIVERY_CONFIG.rateLimit.bulkOrders) {
      return false
    }
    lastBulkOrderRequest = now
  }
  
  return true
}

export async function sendOrderToFirstDelivery(order: Order): Promise<FirstDeliveryResponse> {
  try {
    // Check rate limit
    if (!checkRateLimit('single')) {
      return {
        success: false,
        error_message: 'Rate limit exceeded. Please wait before sending another order.'
      }
    }

    const firstDeliveryOrder = mapOrderToFirstDeliveryFormat(order)
    
    const response = await fetch(`${FIRST_DELIVERY_CONFIG.baseUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRST_DELIVERY_CONFIG.token}`,
      },
      body: JSON.stringify(firstDeliveryOrder),
    })

    const data = await response.json()
    
    // Check for success indicators in the response
    const isSuccess = response.ok && !data.isError && data.status === 201
    const hasTrackingNumber = data.result?.link || data.tracking_number

    return {
      success: isSuccess,
      tracking_number: hasTrackingNumber || order.id.toString(),
      message: data.message || 'Order sent successfully',
      status: data.status,
      isError: data.isError,
      result: data.result,
      error_message: isSuccess ? undefined : (data.message || 'Unknown error')
    }
  } catch (error) {
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function sendBulkOrdersToFirstDelivery(orders: Order[]): Promise<FirstDeliveryResponse> {
  try {
    // Check rate limit
    if (!checkRateLimit('bulk')) {
      return {
        success: false,
        error_message: 'Rate limit exceeded. Please wait before sending bulk orders.'
      }
    }

    // Limit to 100 orders as per API specification
    if (orders.length > 100) {
      return {
        success: false,
        error_message: 'Maximum 100 orders can be sent at once. Please split into smaller batches.'
      }
    }

    // Use the new bulk mapping function that omits nombreEchange
    const firstDeliveryOrders = orders.map(order => mapOrderToFirstDeliveryBulkFormat(order))
    
    const response = await fetch(`${FIRST_DELIVERY_CONFIG.baseUrl}/bulk-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRST_DELIVERY_CONFIG.token}`,
      },
      body: JSON.stringify(firstDeliveryOrders),
    })

    const data = await response.json()
    
    // Check for success indicators in the response
    const isSuccess = response.ok && !data.isError && (data.status === 201 || data.status === 207)
    const hasTrackingNumber = data.result?.link || data.tracking_number

    return {
      success: isSuccess,
      tracking_number: hasTrackingNumber || `bulk-${Date.now()}`,
      message: data.message || 'Bulk orders sent successfully',
      status: data.status,
      isError: data.isError,
      result: data.result,
      error_message: isSuccess ? undefined : (data.message || 'Unknown error')
    }
  } catch (error) {
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getFirstDeliveryOrderStatus(trackingNumber: string): Promise<FirstDeliveryStatusResponse> {
  try {
    const response = await fetch(`${FIRST_DELIVERY_CONFIG.baseUrl}/etat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRST_DELIVERY_CONFIG.token}`,
      },
      body: JSON.stringify({ barCode: trackingNumber }),
    })

    const data = await response.json()
    
    const isSuccess = response.ok && !data.isError
    const hasStatus = data.status || data.etat || data.message

    return {
      success: isSuccess,
      status: hasStatus || 'Unknown',
      message: data.message || 'Status retrieved successfully',
      error_message: isSuccess ? undefined : (data.message || 'Unknown error')
    }
  } catch (error) {
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getFirstDeliveryOrders(pageNumber: number = 1, limit: number = 100): Promise<FirstDeliveryResponse> {
  try {
    const response = await fetch(`${FIRST_DELIVERY_CONFIG.baseUrl}/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRST_DELIVERY_CONFIG.token}`,
      },
      body: JSON.stringify({
        pagination: {
          pageNumber,
          limit
        }
      }),
    })

    const data = await response.json()
    
    const isSuccess = response.ok && !data.isError

    return {
      success: isSuccess,
      message: data.message || 'Orders retrieved successfully',
      status: data.status,
      isError: data.isError,
      result: data.result,
      error_message: isSuccess ? undefined : (data.message || 'Unknown error')
    }
  } catch (error) {
    return {
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Import the validation function from data-mapping
import { validateOrderForFirstDelivery } from './data-mapping'

// Mapping function for single orders (includes nombreEchange: 0)
export function mapOrderToFirstDeliveryFormat(order: Order): FirstDeliveryOrder {
  // Use the validation function to get properly mapped data
  const validation = validateOrderForFirstDelivery(order)
  
  // Return the validated and mapped data
  return {
    Client: {
      nom: validation.mappedData.nom as string,
      gouvernerat: validation.mappedData.gouvernerat as string,
      ville: validation.mappedData.ville as string,
      adresse: validation.mappedData.adresse as string,
      telephone: validation.mappedData.telephone as string,
      telephone2: validation.mappedData.telephone2 as string || ''
    },
    Produit: {
      article: validation.mappedData.article as string,
      prix: validation.mappedData.prix as number,
      designation: validation.mappedData.designation as string,
      nombreArticle: validation.mappedData.nombreArticle as number,
      commentaire: validation.mappedData.commentaire as string,
      nombreEchange: 0
    }
  }
}

// New mapping function for bulk orders (omits nombreEchange field)
export function mapOrderToFirstDeliveryBulkFormat(order: Order): FirstDeliveryBulkOrder {
  // Use the validation function to get properly mapped data
  const validation = validateOrderForFirstDelivery(order)
  
  // Return the validated and mapped data for bulk API
  return {
    Client: {
      nom: validation.mappedData.nom as string,
      gouvernerat: validation.mappedData.gouvernerat as string,
      ville: validation.mappedData.ville as string,
      adresse: validation.mappedData.adresse as string,
      telephone: validation.mappedData.telephone as string,
      telephone2: validation.mappedData.telephone2 as string || ''
    },
    Produit: {
      article: validation.mappedData.article as string,
      prix: validation.mappedData.prix as number,
      designation: validation.mappedData.designation as string,
      nombreArticle: validation.mappedData.nombreArticle as number,
      commentaire: validation.mappedData.commentaire as string
      // nombreEchange is intentionally omitted for bulk API
    }
  }
}