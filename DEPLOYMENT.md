# Deployment Guide - Shopify Droppex Fulfillment System

This guide will help you deploy the Shopify Droppex Fulfillment System to Vercel.

## Prerequisites

1. **GitHub Account**: Your code should be pushed to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Environment Variables**: All required environment variables should be ready

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub with the following structure:
```
shopify-droppex-fulfillment/
├── src/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── README.md
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### 3. Configure Environment Variables

In your Vercel project settings, add the following environment variables:

#### Required Variables
```bash
# Shopify
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Droppex Configuration
# Development Environment
DROPPEX_DEV_URL=https://apidev.droppex.delivery/api_droppex_post
DROPPEX_DEV_CODE_API=582
DROPPEX_DEV_CLE_API=5VnhlnchEpIglis9nBra

# Production Environment
DROPPEX_PROD_URL=https://droppex.delivery/api_droppex_post
DROPPEX_PROD_CODE_API=1044
DROPPEX_PROD_CLE_API=LEyMmMrLtmva65it2dOU
```

#### Optional Variables
```bash
# Authentication (defaults to admin/admin123)
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
```

### 4. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your application will be available at the provided URL

### 5. Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed

## Post-Deployment Setup

### 1. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL from `database-setup.sql` in your Supabase SQL editor
3. Copy your Supabase URL and service role key to Vercel environment variables

### 2. Shopify Webhook Configuration

1. In your Shopify admin, go to Settings > Notifications
2. Scroll down to "Webhooks"
3. Add a new webhook:
   - **Event**: Order creation
   - **Format**: JSON
   - **URL**: `https://your-vercel-domain.vercel.app/api/shopify-webhook`
4. Copy the webhook secret to your Vercel environment variables

### 3. Test the Integration

1. Visit your deployed application
2. Log in with the admin credentials
3. Test the order fetching functionality
4. Test the Droppex integration (once credentials are provided)

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SHOPIFY_DOMAIN` | Your Shopify store domain | `my-store.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | Shopify API access token | `shpat_xxxxxxxxxxxxxxxxxxxx` |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify webhook secret | `whsec_xxxxxxxxxxxxxxxxxxxx` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxxxxxxxxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJxxxxxxxxxxxxxxxxxxxx` |
| `DROPPEX_DEV_URL` | Droppex dev environment URL | `https://apidev.droppex.delivery/api_droppex_post` |
| `DROPPEX_DEV_CODE_API` | Droppex dev environment code | `582` |
| `DROPPEX_DEV_CLE_API` | Droppex dev environment key | `5VnhlnchEpIglis9nBra` |
| `DROPPEX_PROD_URL` | Droppex prod environment URL | `https://droppex.delivery/api_droppex_post` |
| `DROPPEX_PROD_CODE_API` | Droppex prod environment code | `1044` |
| `DROPPEX_PROD_CLE_API` | Droppex prod environment key | `LEyMmMrLtmva65it2dOU` |

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation passes locally
   - Check Vercel build logs for specific errors

2. **Environment Variables**
   - Verify all required variables are set in Vercel
   - Check for typos in variable names
   - Ensure sensitive data is properly secured

3. **Database Connection**
   - Verify Supabase credentials are correct
   - Check that the database table exists
   - Ensure RLS policies allow the necessary operations

4. **Shopify Integration**
   - Verify API credentials have correct permissions
   - Check that webhook URL is accessible
   - Test API calls manually if needed

### Debug Mode

Add `DEBUG=true` to your environment variables to enable detailed logging.

### Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Consider adding Sentry or similar
3. **Performance**: Monitor API response times

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **API Keys**: Rotate keys regularly
3. **Webhook Security**: Verify webhook signatures
4. **Database Access**: Use service role keys only when necessary
5. **Authentication**: Consider implementing proper auth for production

## Scaling Considerations

1. **Database**: Supabase automatically scales
2. **API Limits**: Monitor Shopify and Droppex API usage
3. **Caching**: Consider implementing Redis for caching
4. **CDN**: Vercel provides global CDN automatically

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs in Vercel dashboard
3. Test locally before deploying
4. Contact support with specific error messages 