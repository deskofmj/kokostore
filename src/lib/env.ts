// Runtime environment variable validation
export function validateEnv() {
  const required = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN,
    SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
    // Droppex environment variables are optional with defaults
    DROPPEX_DEV_URL: process.env.DROPPEX_DEV_URL,
    DROPPEX_DEV_CODE_API: process.env.DROPPEX_DEV_CODE_API,
    DROPPEX_DEV_CLE_API: process.env.DROPPEX_DEV_CLE_API,
    DROPPEX_PROD_URL: process.env.DROPPEX_PROD_URL,
    DROPPEX_PROD_CODE_API: process.env.DROPPEX_PROD_CODE_API,
    DROPPEX_PROD_CLE_API: process.env.DROPPEX_PROD_CLE_API,
  }

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return required
}

// Get environment variables with validation
export function getEnv() {
  return validateEnv()
} 