import { Order } from './supabase'

export interface DataMappingResult {
  success: boolean
  mappedData: any
  errors: string[]
  warnings: string[]
}

export interface DroppexMappingValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  mappedData: any
}

/**
 * Validates and maps Shopify order data to our internal format
 */
export function validateShopifyToSupabase(shopifyOrder: any): DataMappingResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required fields validation
  if (!shopifyOrder.id) {
    errors.push('Order ID is required')
  }
  
  if (!shopifyOrder.name) {
    errors.push('Order name is required')
  }
  
  if (!shopifyOrder.email) {
    errors.push('Customer email is required')
  }
  
  // Price validation
  let totalPrice = 0
  if (shopifyOrder.total_price) {
    const price = parseFloat(shopifyOrder.total_price)
    if (isNaN(price)) {
      errors.push('Invalid total_price format')
    } else {
      totalPrice = price
    }
  } else {
    warnings.push('No total_price provided')
  }
  
  // Shipping address validation
  const shippingAddress = shopifyOrder.shipping_address || {}
  if (!shippingAddress.address1) {
    warnings.push('No shipping address provided')
  }
  
  if (!shippingAddress.city) {
    warnings.push('No shipping city provided')
  }
  
  if (!shippingAddress.zip) {
    warnings.push('No postal code provided')
  }
  
  if (!shippingAddress.phone && !shopifyOrder.customer?.phone) {
    warnings.push('No phone number provided')
  }
  
  // Customer validation
  const customer = shopifyOrder.customer || {}
  if (!customer.first_name && !customer.last_name && !shippingAddress.name) {
    warnings.push('No customer name provided')
  }
  
  const mappedData = {
    id: shopifyOrder.id,
    name: shopifyOrder.name || `Order #${shopifyOrder.id}`,
    email: shopifyOrder.email || '',
    created_at: shopifyOrder.created_at || new Date().toISOString(),
    total_price: totalPrice,
    line_items: Array.isArray(shopifyOrder.line_items) ? shopifyOrder.line_items : [],
    shipping_address: shippingAddress,
    billing_address: shopifyOrder.billing_address || null,
    tags: shopifyOrder.tags || '',
    fulfillment_status: shopifyOrder.fulfillment_status || 'unfulfilled',
    financial_status: shopifyOrder.financial_status || 'paid',
    note: shopifyOrder.note || '',
    customer: customer,
  }
  
  return {
    success: errors.length === 0,
    mappedData,
    errors,
    warnings
  }
}

/**
 * Validates and maps order data to Droppex format
 */
export function validateOrderForDroppex(order: Order): DroppexMappingValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required field validation
  if (!order.id) {
    errors.push('Order ID is required')
  }
  
  if (!order.name) {
    errors.push('Order name is required')
  }
  
  // Customer information validation
  const customerName = order.shipping_address?.name || 
                      `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim()
  
  if (!customerName || customerName === '') {
    errors.push('Customer name is required')
  }
  
  // Phone number validation
  const phone = order.shipping_address?.phone || 
                order.customer?.phone || 
                '00000000'
  
  if (phone === '00000000') {
    warnings.push('Using default phone number (00000000)')
  }
  
  // Address validation
  const address = order.shipping_address?.address1 || ''
  if (!address) {
    errors.push('Shipping address is required')
  }
  
  const city = order.shipping_address?.city || ''
  if (!city) {
    errors.push('Shipping city is required')
  }
  
  // Postal code validation
  const zipCode = order.shipping_address?.zip || ''
  if (!zipCode) {
    warnings.push('No postal code provided, using default (1000)')
  } else {
    // Validate postal code format to prevent wrong field mapping
    const cleanZipCode = zipCode.toString().trim()
    if (!/^\d{4,5}$/.test(cleanZipCode)) {
      warnings.push(`Postal code format may be invalid: ${zipCode}`)
    }
  }
  
  // Province/State validation and governorate code mapping
  const province = order.shipping_address?.province || ''
  if (!province) {
    warnings.push('No province provided, using default (Tunis)')
  }
  
  // Map province to governorate ID (you may need to adjust these mappings)
  const getGovernorateId = (provinceName: string): string => {
    const governorateMap: Record<string, string> = {
      'Tunis': '1',
      'Sousse': '2', 
      'Monastir': '3',
      'Mahdia': '4',
      'Sfax': '5',
      'Gabès': '6',
      'Médenine': '7',
      'Gafsa': '8',
      'Tozeur': '9',
      'Kébili': '10',
      'Kairouan': '11',
      'Kasserine': '12',
      'Sidi Bouzid': '13',
      'Zaghouan': '14',
      'Nabeul': '15',
      'Béja': '16',
      'Jendouba': '17',
      'Le Kef': '18',
      'Siliana': '19',
      'Bizerte': '20',
      'Béni Arous': '21',
      'Ariana': '22',
      'Manouba': '23',
      'Tataouine': '24'
    }
    return governorateMap[provinceName] || '1' // Default to Tunis
  }
  
  // Line items validation
  if (!order.line_items || order.line_items.length === 0) {
    warnings.push('No line items found')
  }
  
  // Get libelle from order name or first line item
  const getLibelle = (): string => {
    if (order.line_items && order.line_items.length > 0) {
      const firstItem = order.line_items[0]
      return firstItem.title || firstItem.name || order.name
    }
    return order.name
  }
  
  // Get full address
  const getFullAddress = (): string => {
    const address1 = order.shipping_address?.address1 || ''
    const address2 = order.shipping_address?.address2 || ''
    return `${address1} ${address2}`.trim()
  }
  
  const mappedData = {
    action: 'add',
    tel_l: phone,
    nom_client: customerName,
    gov_l: getGovernorateId(province),
    cp_l: zipCode || '1000',  // Postal code field
    cod: (order.total_price || 0).toFixed(2),  // Price field
    libelle: getLibelle(),
    nb_piece: (order.line_items?.length || 1).toString(),
    adresse_l: getFullAddress(),
    remarque: order.note || 'Standard delivery',
    tel2_l: phone,  // Same as primary phone for now
    service: 'Livraison'
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    mappedData
  }
}

/**
 * Formats order data for display with proper validation
 */
export function formatOrderForDisplay(order: Order) {
  const validation = validateOrderForDroppex(order)
  
  return {
    order,
    validation,
    displayData: {
      customerName: order.shipping_address?.name || 
                   `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
      phone: order.shipping_address?.phone || order.customer?.phone || 'N/A',
      address: order.shipping_address?.address1 || 'N/A',
      city: order.shipping_address?.city || 'N/A',
      province: order.shipping_address?.province || 'N/A',
      postalCode: order.shipping_address?.zip || 'N/A',
      totalPrice: order.total_price || 0,
      itemCount: order.line_items?.length || 0
    }
  }
}

/**
 * Gets a summary of data quality for an order
 */
export function getOrderDataQuality(order: Order) {
  const issues: string[] = []
  const warnings: string[] = []
  
  // Check for missing critical data
  if (!order.shipping_address?.address1) {
    issues.push('Missing shipping address')
  }
  
  if (!order.shipping_address?.city) {
    issues.push('Missing shipping city')
  }
  
  if (!order.shipping_address?.zip) {
    warnings.push('Missing postal code')
  }
  
  if (!order.shipping_address?.phone && !order.customer?.phone) {
    warnings.push('Missing phone number')
  }
  
  if (!order.shipping_address?.name && (!order.customer?.first_name && !order.customer?.last_name)) {
    warnings.push('Missing customer name')
  }
  
  if (!order.line_items || order.line_items.length === 0) {
    warnings.push('No order items')
  }
  
  return {
    hasIssues: issues.length > 0,
    hasWarnings: warnings.length > 0,
    issues,
    warnings,
    qualityScore: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 10))
  }
} 