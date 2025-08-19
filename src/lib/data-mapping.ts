import { Order } from './supabase'
import { getGovernorateFromPostalCode } from './postal-codes'

export interface DataMappingResult {
  success: boolean
  mappedData: Record<string, unknown>
  errors: string[]
  warnings: string[]
}

export interface DroppexMappingValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  mappedData: Record<string, unknown>
}

/**
 * Validates and maps Shopify order data to our internal format
 */
export function validateShopifyToSupabase(shopifyOrder: Record<string, unknown>): DataMappingResult {
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
    warnings.push('No customer email provided (optional for Droppex)')
  }
  
  // Price validation
  let totalPrice = 0
  if (shopifyOrder.total_price) {
    const price = parseFloat(shopifyOrder.total_price as string)
    if (isNaN(price)) {
      errors.push('Invalid total_price format')
    } else {
      totalPrice = price
    }
  } else {
    warnings.push('No total_price provided')
  }
  
  // Shipping address validation
  const shippingAddress = shopifyOrder.shipping_address as Record<string, unknown> || {}
  if (!shippingAddress.address1) {
    warnings.push('No shipping address provided')
  }
  
  if (!shippingAddress.city) {
    warnings.push('No shipping city provided')
  }
  
  if (!shippingAddress.zip) {
    warnings.push('No postal code provided')
  }
  
  if (!shippingAddress.phone && !(shopifyOrder.customer as Record<string, unknown>)?.phone) {
    warnings.push('No phone number provided')
  }
  
  // Customer validation
  const customer = shopifyOrder.customer as Record<string, unknown> || {}
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
  
  // Phone number validation and cleaning
  const rawPhone = (order.shipping_address?.phone as string) || 
                   (order.customer?.phone as string) || 
                   '00000000'
  
  // Clean phone number: remove +216 prefix and any non-digit characters
  const cleanPhoneNumber = (phoneStr: string): string => {
    if (phoneStr === '00000000') return phoneStr
    
    // Remove +216 prefix if present
    let cleaned = phoneStr.replace(/^\+216/, '')
    
    // Remove any other non-digit characters (spaces, dashes, parentheses, etc.)
    cleaned = cleaned.replace(/\D/g, '')
    
    // If the number starts with 216 after cleaning, remove it
    if (cleaned.startsWith('216')) {
      cleaned = cleaned.substring(3)
    }
    
    // Ensure we have a valid length (should be 8 digits for Tunisian numbers)
    if (cleaned.length === 8) {
      return cleaned
    } else if (cleaned.length > 8) {
      // If longer, take the last 8 digits
      return cleaned.slice(-8)
    } else {
      // If shorter, pad with zeros or return default
      return cleaned.padEnd(8, '0')
    }
  }
  
  const phone = cleanPhoneNumber(rawPhone)
  
  if (phone === '00000000') {
    warnings.push('Using default phone number (00000000)')
  } else if (rawPhone !== phone) {
    // console.log(`Phone number cleaned: "${rawPhone}" → "${phone}"`)
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
  
  // Enhanced governorate detection from address information
  const detectGovernorateFromAddress = (order: Order): { governorate: string, method: string } => {
    const address = order.shipping_address?.address1 || ''
    const city = order.shipping_address?.city || ''
    const zipCode = order.shipping_address?.zip || ''
    const province = order.shipping_address?.province || ''
    
    // Method 1: Postal code detection (most accurate)
    if (zipCode) {
      const governorateFromPostal = getGovernorateFromPostalCode(zipCode as string)
      if (governorateFromPostal) {
        return { governorate: governorateFromPostal, method: 'postal_code' }
      }
    }
    
    // Method 2: Check if province is already a valid governorate
    const governorateMap: Record<string, string> = {
      'Tunis': 'Tunis',
      'Sousse': 'Sousse', 
      'Monastir': 'Monastir',
      'Mahdia': 'Mahdia',
      'Sfax': 'Sfax',
      'Gabès': 'Gabès',
      'Médenine': 'Médenine',
      'Gafsa': 'Gafsa',
      'Tozeur': 'Tozeur',
      'Kébili': 'Kébili',
      'Kairouan': 'Kairouan',
      'Kasserine': 'Kasserine',
      'Sidi Bouzid': 'Sidi Bouzid',
      'Zaghouan': 'Zaghouan',
      'Nabeul': 'Nabeul',
      'Béja': 'Béja',
      'Jendouba': 'Jendouba',
      'Le Kef': 'Le Kef',
      'Siliana': 'Siliana',
      'Bizerte': 'Bizerte',
      'Béni Arous': 'Béni Arous',
      'Ariana': 'Ariana',
      'Manouba': 'Manouba',
      'Tataouine': 'Tataouine'
    }
    
        // If province is already a valid governorate, use it
    if (province && governorateMap[province as string]) {
      return { governorate: governorateMap[province as string], method: 'province' }
    }
    
    // Method 3: Detect from city name (enhanced with more variations)
    const cityToGovernorate: Record<string, string> = {
      // Tunis Governorate
      'tunis': 'Tunis',
      'la marsa': 'Tunis',
      'carthage': 'Tunis',
      'sidi bou said': 'Tunis',
      'le bardo': 'Tunis',
      'ariana': 'Ariana',
      'la soukra': 'Ariana',
      'raoued': 'Ariana',
      
      // Sousse Governorate
      'sousse': 'Sousse',
      'hammam sousse': 'Sousse',
      'kantaoui': 'Sousse',
      'msaken': 'Sousse',
      'enfidha': 'Sousse',
      'monastir': 'Monastir',
      'moknine': 'Monastir',
      'jemmal': 'Monastir',
      'mahdia': 'Mahdia',
      'rejiche': 'Mahdia',
      
      // Sfax Governorate
      'sfax': 'Sfax',
      'sakiet ezzit': 'Sfax',
      'thyna': 'Sfax',
      
      // Gabès Governorate (enhanced with variations)
      'gabès': 'Gabès',
      'gabes': 'Gabès', // Handle non-accented version
      'métouia': 'Gabès',
      'metouia': 'Gabès', // Handle non-accented version
      'el hamma': 'Gabès',
      'mareth': 'Gabès',
      'ghannouche': 'Gabès',
      'matmata': 'Gabès',
      'menzel habib': 'Gabès',
      
      // Médenine Governorate
      'médenine': 'Médenine',
      'medenine': 'Médenine', // Handle non-accented version
      'zarzis': 'Médenine',
      'djerba': 'Médenine',
      'houmet souk': 'Médenine',
      'midoun': 'Médenine',
      
      // Other major cities
      'gafsa': 'Gafsa',
      'tozeur': 'Tozeur',
      'kébili': 'Kébili',
      'kebili': 'Kébili', // Handle non-accented version
      'kairouan': 'Kairouan',
      'kasserine': 'Kasserine',
      'sidi bouzid': 'Sidi Bouzid',
      'zaghouan': 'Zaghouan',
      'nabeul': 'Nabeul',
      'hammamet': 'Nabeul',
      'béja': 'Béja',
      'beja': 'Béja', // Handle non-accented version
      'jendouba': 'Jendouba',
      'le kef': 'Le Kef',
      'siliana': 'Siliana',
      'bizerte': 'Bizerte',
      'béni arous': 'Béni Arous',
      'beni arous': 'Béni Arous', // Handle non-accented version
      'manouba': 'Manouba',
      'tataouine': 'Tataouine'
    }
    
    const normalizedCity = (city as string).toLowerCase().trim()
    if (cityToGovernorate[normalizedCity]) {
      return { governorate: cityToGovernorate[normalizedCity], method: 'city' }
    }
    
    // Method 4: Detect from postal code ranges (fallback for invalid postal codes)
    const postalCodeRanges: Record<string, { min: number, max: number, name: string }> = {
      'Tunis': { min: 1000, max: 1099, name: 'Tunis' },
      'Ariana': { min: 2000, max: 2099, name: 'Ariana' },
      'Sfax': { min: 3000, max: 3099, name: 'Sfax' },
      'Sousse': { min: 4000, max: 4099, name: 'Sousse' },
      'Monastir': { min: 5000, max: 5099, name: 'Monastir' },
      'Mahdia': { min: 5100, max: 5199, name: 'Mahdia' },
      'Gabès': { min: 6000, max: 6099, name: 'Gabès' },
      'Médenine': { min: 6100, max: 6199, name: 'Médenine' },
      'Gafsa': { min: 2100, max: 2199, name: 'Gafsa' },
      'Tozeur': { min: 2200, max: 2299, name: 'Tozeur' },
      'Kébili': { min: 4200, max: 4299, name: 'Kébili' },
      'Kairouan': { min: 3100, max: 3199, name: 'Kairouan' },
      'Kasserine': { min: 1200, max: 1299, name: 'Kasserine' },
      'Sidi Bouzid': { min: 9100, max: 9199, name: 'Sidi Bouzid' },
      'Zaghouan': { min: 1100, max: 1199, name: 'Zaghouan' },
      'Nabeul': { min: 8000, max: 8099, name: 'Nabeul' },
      'Béja': { min: 9000, max: 9099, name: 'Béja' },
      'Jendouba': { min: 8100, max: 8199, name: 'Jendouba' },
      'Le Kef': { min: 7100, max: 7199, name: 'Le Kef' },
      'Siliana': { min: 6100, max: 6199, name: 'Siliana' },
      'Bizerte': { min: 7000, max: 7099, name: 'Bizerte' },
      'Béni Arous': { min: 2000, max: 2099, name: 'Béni Arous' },
      'Manouba': { min: 2000, max: 2099, name: 'Manouba' },
      'Tataouine': { min: 3200, max: 3299, name: 'Tataouine' }
    }
    
    if (zipCode) {
      const zip = parseInt(zipCode as string)
      if (!isNaN(zip)) {
        for (const [key, range] of Object.entries(postalCodeRanges)) {
          if (zip >= range.min && zip <= range.max) {
            return { governorate: range.name, method: 'postal_range' }
          }
        }
      }
    }
    
    // Method 5: Search in address text
    const addressText = `${address} ${city} ${province}`.toLowerCase()
    for (const [governorateName, governorateValue] of Object.entries(governorateMap)) {
      if (addressText.includes(governorateName.toLowerCase())) {
        return { governorate: governorateValue, method: 'address_text' }
      }
    }
    
    // Default fallback
    return { governorate: 'Tunis', method: 'default' }
  }
  
  // Detect governorate from address information
  const detectionResult = detectGovernorateFromAddress(order)
  const detectedGovernorate = detectionResult.governorate
  const detectionMethod = detectionResult.method
  const province = order.shipping_address?.province || detectedGovernorate
  
  if (!order.shipping_address?.province) {
    const methodText = detectionMethod === 'postal_code' ? 'from postal code' : 
                      detectionMethod === 'city' ? 'from city' :
                      detectionMethod === 'province' ? 'from province' :
                      detectionMethod === 'postal_range' ? 'from postal code range' :
                      detectionMethod === 'address_text' ? 'from address text' : 'as default'
    warnings.push(`No province provided, detected ${methodText}: ${detectedGovernorate}`)
  } else if ((order.shipping_address.province as string) !== detectedGovernorate) {
    warnings.push(`Province mismatch: provided "${order.shipping_address.province}" vs detected "${detectedGovernorate}"`)
  }
  
  // Map governorate name to ID
  const getGovernorateId = (governorateName: string): string => {
    const governorateIdMap: Record<string, string> = {
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
    return governorateIdMap[governorateName] || '1' // Default to Tunis
  }
  
  // Line items validation
  if (!order.line_items || order.line_items.length === 0) {
    warnings.push('No line items found')
  }
  
  // Get enhanced libelle with all product details
  const getLibelle = (): string => {
    if (order.line_items && order.line_items.length > 0) {
      const productDetails = order.line_items.map((item: Record<string, unknown>) => {
        const title = (item.title as string) || (item.name as string) || 'Unknown Product'
        const quantity = (item.quantity as number) || 1
        const variant = (item.variant_title as string) || ''
        
        if (variant) {
          return `${title} (${variant}) x${quantity}`
        } else {
          return `${title} x${quantity}`
        }
      }).join(', ')
      
      return productDetails
    }
    return order.name
  }
  
  // Get full address
  const getFullAddress = (): string => {
    const address1 = order.shipping_address?.address1 || ''
    const address2 = order.shipping_address?.address2 || ''
    return `${address1} ${address2}`.trim()
  }
  
  // Get the libelle content for both libelle and remarque fields
  const libelleContent = getLibelle()
  
  // Combine order note with libelle content for remarque
  const remarqueContent = order.note 
    ? `${order.note} | ${libelleContent}`
    : libelleContent

  const mappedData = {
    action: 'add',
    tel_l: phone,
    nom_client: customerName,
    gov_l: order.shipping_address?.city || '', // Use city name in governorate field
    cp_l: zipCode || '',  // Leave empty when missing (no default)
    cod: (order.total_price || 0).toFixed(2),  // Price field
    libelle: libelleContent,
    nb_piece: (order.line_items?.length || 1).toString(),
    adresse_l: getFullAddress(), // Use full address (address1 + address2)
    remarque: remarqueContent,
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