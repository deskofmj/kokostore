# Shopify Droppex Fulfillment System

A comprehensive order fulfillment system that integrates Shopify with the Droppex delivery service. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Shopify Integration**: Fetch and sync orders from your Shopify store
- **Droppex Integration**: ✅ **COMPLETED** - Send orders to Droppex for fulfillment
- **Order Management**: Modern UI for managing orders with search and filtering
- **Real-time Updates**: Webhook support for live order updates
- **Authentication**: Basic hardcoded authentication system
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **UI**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase
- **Authentication**: Basic hardcoded authentication
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Shopify store with API access
- ~~Droppex API credentials~~ ✅ **Already configured**

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd shopify-droppex-fulfillment
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Shopify
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication (optional - defaults to admin/admin123)
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
```

**Note**: Droppex API credentials are configured via environment variables and automatically switch between dev/prod environments based on NODE_ENV.

### 3. Database Setup

Create a new Supabase project and run the following SQL to create the orders table:

```sql
-- Orders table
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  name VARCHAR,
  email VARCHAR,
  created_at TIMESTAMP,
  total_price DECIMAL,
  line_items JSONB,
  shipping_address JSONB,
  billing_address JSONB,
  tags VARCHAR,
  fulfillment_status VARCHAR,
  financial_status VARCHAR,
  note TEXT,
  customer JSONB,
  parcel_status VARCHAR DEFAULT 'Not sent',
  droppex_response JSONB,
  created_at_db TIMESTAMP DEFAULT NOW()
);
```

### 4. Shopify Setup

1. Create a private app in your Shopify admin
2. Enable the following API permissions:
   - Read orders
   - Read customers
   - Read products
3. Copy the API key and secret to your environment variables
4. Set up webhooks for order creation/updates pointing to `/api/shopify-webhook`

### 5. Development

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

### 6. Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add all environment variables to Vercel
4. Deploy

## API Routes

### `/api/shopify-orders`
- **GET**: Fetch orders from Shopify and sync with database

### `/api/send-to-carrier`
- **POST**: Send selected orders to Droppex
- Body: `{ orderIds: number[] }`

### `/api/shopify-webhook`
- **POST**: Handle Shopify webhooks for order updates

### `/api/revert-order`
- **POST**: Revert order status to "Not sent"
- Body: `{ orderId: number }`

### `/api/droppex-status`
- **GET**: Check Droppex API connection status for both dev and prod environments
- Returns connection status and error messages for each environment

## Authentication

The system uses basic hardcoded authentication:
- Username: `admin` (or set via `NEXT_PUBLIC_ADMIN_USERNAME`)
- Password: `admin123` (or set via `NEXT_PUBLIC_ADMIN_PASSWORD`)

## Order Status

Orders can have the following parcel statuses:
- **Not sent**: Order is ready to be sent to Droppex
- **Sent to Droppex**: Order has been successfully sent to Droppex
- **Failed**: Order failed to send to Droppex

## Features

### Order Management
- View all orders in a responsive table
- Search orders by name or email
- Filter orders by status
- Bulk select orders for batch operations
- View detailed order information in a modal

### API Status Monitoring
- Real-time Droppex API connection status for both dev and prod environments
- Visual indicators (green wifi icon = connected, red wifi-off icon = disconnected)
- Hover tooltips showing connection details and error messages
- Automatic status checking on page load and refresh

### Droppex Integration ✅ **COMPLETED**
- Send individual orders to Droppex
- Bulk send multiple orders
- Track success/failure status
- Store Droppex responses for debugging
- Automatic environment switching (dev/prod)
- Proper error handling and response parsing

### Real-time Updates
- Shopify webhooks for live order updates
- Automatic order synchronization
- Status tracking and updates

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── shopify-orders/route.ts
│   │   ├── send-to-carrier/route.ts
│   │   ├── shopify-webhook/route.ts
│   │   └── revert-order/route.ts
│   ├── login/page.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── auth-provider.tsx
│   └── ui/
│       ├── button.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── badge.tsx
└── lib/
    ├── droppex.ts                       # ✅ COMPLETED
    ├── shopify.ts
    ├── supabase.ts
    └── utils.ts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SHOPIFY_DOMAIN` | Your Shopify store domain | Yes |
| `SHOPIFY_ACCESS_TOKEN` | Shopify API access token | Yes |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify webhook secret | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_ADMIN_USERNAME` | Admin username | No (default: admin) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Admin password | No (default: admin123) |

**Note**: Droppex API credentials are hardcoded and automatically switch between dev/prod environments.

## Troubleshooting

### Common Issues

1. **Orders not loading**: Check Shopify API credentials and permissions
2. **Droppex integration failing**: Check network connectivity and API endpoints
3. **Database errors**: Ensure Supabase connection and table schema
4. **Authentication issues**: Check environment variables for username/password

### Debug Mode

Enable debug logging by adding `DEBUG=true` to your environment variables.

## Droppex API Details

The system is configured with the following Droppex API endpoints:

### Development Environment
- **URL**: `https://apidev.droppex.delivery/api_droppex_post`
- **Code_API**: `582`
- **Cle_API**: `5VnhlnchEpIglis9nBra`

### Production Environment
- **URL**: `https://droppex.delivery/api_droppex_post`
- **Code_API**: `1044`
- **Cle_API**: `LEyMmMrLtmva65it2dOU`

### API Operations
- **Create Package**: `action=add`
- **Get Package**: `action=get`
- **List Packages**: `action=list`
- **Update Package**: `action=update`
- **Delete Package**: `action=delete`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Test the integration locally
4. Contact support with specific error messages 