/**
 * Tunisian Postal Code Database
 * Provides governorate detection based on postal codes
 */

export interface PostalCodeData {
  governorate: string
  district: string
}

// Import the postal code data
import postalData from '../../postalcodes.json'

// Create reverse lookup maps for better performance
const POSTAL_CODE_TO_GOVERNORATE: Record<string, string> = {}
const POSTAL_CODE_TO_DISTRICT: Record<string, string> = {}

// Build the lookup maps
Object.entries(postalData.data).forEach(([governorate, districts]) => {
  Object.entries(districts).forEach(([district, postalCodes]) => {
    (postalCodes as string[]).forEach(code => {
      POSTAL_CODE_TO_GOVERNORATE[code] = governorate
      POSTAL_CODE_TO_DISTRICT[code] = district
    })
  })
})

// Map governorate names to our standard format
const GOVERNORATE_NAME_MAP: Record<string, string> = {
  'ARIANA': 'Ariana',
  'BEJA': 'Béja',
  'BEN AROUS': 'Béni Arous',
  'BIZERTE': 'Bizerte',
  'GABES': 'Gabès',
  'GAFSA': 'Gafsa',
  'JENDOUBA': 'Jendouba',
  'KAIROUAN': 'Kairouan',
  'KASSERINE': 'Kasserine',
  'KEBILI': 'Kébili',
  'KEF': 'Le Kef',
  'MAHDIA': 'Mahdia',
  'MANOUBA': 'Manouba',
  'MEDENINE': 'Médenine',
  'MONASTIR': 'Monastir',
  'NABEUL': 'Nabeul',
  'SFAX': 'Sfax',
  'SIDI BOUZID': 'Sidi Bouzid',
  'SILIANA': 'Siliana',
  'SOUSSE': 'Sousse',
  'TATAOUINE': 'Tataouine',
  'TOZEUR': 'Tozeur',
  'TUNIS': 'Tunis',
  'ZAGHOUAN': 'Zaghouan'
}

/**
 * Get governorate from postal code
 */
export function getGovernorateFromPostalCode(postalCode: string): string | null {
  if (!postalCode) return null
  
  const cleanCode = postalCode.trim()
  const governorate = POSTAL_CODE_TO_GOVERNORATE[cleanCode]
  
  if (governorate) {
    return GOVERNORATE_NAME_MAP[governorate] || governorate
  }
  
  return null
}

/**
 * Get district from postal code
 */
export function getDistrictFromPostalCode(postalCode: string): string | null {
  if (!postalCode) return null
  
  const cleanCode = postalCode.trim()
  return POSTAL_CODE_TO_DISTRICT[cleanCode] || null
}

/**
 * Get full postal code data
 */
export function getPostalCodeData(postalCode: string): PostalCodeData | null {
  if (!postalCode) return null
  
  const cleanCode = postalCode.trim()
  const governorate = POSTAL_CODE_TO_GOVERNORATE[cleanCode]
  const district = POSTAL_CODE_TO_DISTRICT[cleanCode]
  
  if (governorate && district) {
    return {
      governorate: GOVERNORATE_NAME_MAP[governorate] || governorate,
      district
    }
  }
  
  return null
}

/**
 * Check if a postal code is valid
 */
export function isValidPostalCode(postalCode: string): boolean {
  if (!postalCode) return false
  
  const cleanCode = postalCode.trim()
  return cleanCode in POSTAL_CODE_TO_GOVERNORATE
}

/**
 * Get all postal codes for a governorate
 */
export function getPostalCodesForGovernorate(governorateName: string): string[] {
  const codes: string[] = []
  
  // Find the governorate key (might be in French or English)
  let governorateKey = ''
  for (const [key, value] of Object.entries(GOVERNORATE_NAME_MAP)) {
    if (value === governorateName || key === governorateName.toUpperCase()) {
      governorateKey = key
      break
    }
  }
  
  if (governorateKey && postalData.data[governorateKey as keyof typeof postalData.data]) {
    const districts = postalData.data[governorateKey as keyof typeof postalData.data]
    Object.values(districts).forEach(postalCodes => {
      codes.push(...(postalCodes as string[]))
    })
  }
  
  return codes.sort()
}