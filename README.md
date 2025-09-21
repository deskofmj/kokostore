# Koko Store First Delivery Fulfillment System

A comprehensive order fulfillment system that integrates Shopify with the First Delivery service. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Shopify Integration**: Fetch and sync orders from your Shopify store via webhooks
- **First Delivery Integration**: ✅ **COMPLETED** - Send orders to First Delivery for fulfillment
- **Order Management**: Modern UI for managing orders with search and filtering
- **Real-time Updates**: Webhook support for live order updates
- **Authentication**: Basic hardcoded authentication system
- **Toast Notifications**: Comprehensive success/error feedback system
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
- Shopify store with webhook access
- First Delivery API credentials

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd koko-store-fulfillment
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Shopify (Webhook-Only Mode)
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# First Delivery Configuration
FIRST_DELIVERY_BASE_URL=https://api.firstdelivery.com
FIRST_DELIVERY_TOKEN=your_first_delivery_token

# Authentication (optional - defaults to admin/admin)
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
```

### 3. Database Setup

Create a new Supabase project and run the following SQL to create the orders table:

```sql
-- Orders table
CREATE TABLE kokostore_orders (
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
  first_delivery_response JSONB,
  created_at_db TIMESTAMP DEFAULT NOW()
);
```

### 4. Shopify Setup (Webhook-Only)

1. **Webhook Configuration Only** - No API access token needed
2. Set up webhooks in your Shopify admin:
   - Go to **Settings** → **Notifications** → **Webhooks**
   - Add webhook for **Order creation** pointing to `/api/shopify-webhook`
   - Add webhook for **Order edit** pointing to `/api/shopify-webhook`
   - Format: JSON, API version: 2024-10 (recommended)
3. Copy the webhook secret to your environment variables
4. **No API permissions required** - we only use webhooks for data

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
- **POST**: Send selected orders to First Delivery
- Body: `{ orderIds: number[] }`

### `/api/shopify-webhook`
- **POST**: Handle Shopify webhooks for order updates

### `/api/revert-order`
- **POST**: Revert order status to "Not sent"
- Body: `{ orderId: number }`

### `/api/first-delivery-status`
- **GET**: Check First Delivery API connection status

### `/api/verify-first-delivery-order`
- **POST**: Verify order status in First Delivery
- Body: `{ trackingNumber: string }`

### `/api/test-first-delivery-mapping`
- **POST**: Test order mapping to First Delivery format
- Body: `{ orderId: number }`

## Authentication

The system uses basic hardcoded authentication:
- Username: `admin` (or set via `NEXT_PUBLIC_ADMIN_USERNAME`)
- Password: `admin` (or set via `NEXT_PUBLIC_ADMIN_PASSWORD`)

## Order Status

Orders can have the following parcel statuses:
- **Not sent**: Order is ready to be sent to First Delivery
- **Sent to First Delivery**: Order has been successfully sent to First Delivery
- **Failed**: Order failed to send to First Delivery

## Features

### Order Management
- View all orders in a responsive table
- Search orders by name, email, phone, address, or city
- Filter orders by status (New, Sent, Failed)
- Bulk select orders for batch operations
- View detailed order information in a modal
- Data quality indicators and validation

### API Status Monitoring
- Real-time First Delivery API connection status
- Visual indicators (green wifi icon = connected, red wifi-off icon = disconnected)
- Hover tooltips showing connection details and error messages
- Automatic status checking on page load and refresh

### First Delivery Integration ✅ **COMPLETED**
- Send individual orders to First Delivery
- Bulk send multiple orders (up to 100 at once)
- Track success/failure status
- Store First Delivery responses for debugging
- Rate limiting compliance (1 req/10sec for both single and bulk)
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
│   │   ├── revert-order/route.ts
│   │   ├── first-delivery-status/route.ts
│   │   ├── verify-first-delivery-order/route.ts
│   │   └── test-first-delivery-mapping/route.ts
│   ├── login/page.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── auth-provider.tsx
│   ├── dashboard/
│   │   ├── order-table.tsx
│   │   ├── status-indicators.tsx
│   │   ├── data-quality-indicator.tsx
│   │   ├── header-actions.tsx
│   │   └── search-filters.tsx
│   ├── verification-modal.tsx
│   └── ui/
│       ├── button.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── badge.tsx
└── lib/
    ├── first-delivery.ts              # ✅ COMPLETED
    ├── shopify.ts
    ├── supabase.ts
    ├── data-mapping.ts
    └── utils.ts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SHOPIFY_WEBHOOK_SECRET` | Shopify webhook secret | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `FIRST_DELIVERY_BASE_URL` | First Delivery API base URL | Yes |
| `FIRST_DELIVERY_TOKEN` | First Delivery API token | Yes |
| `NEXT_PUBLIC_ADMIN_USERNAME` | Admin username | No (default: admin) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Admin password | No (default: admin) |

## First Delivery API Details

The system integrates with First Delivery API using:

### Authentication
- **Type**: Bearer token
- **Header**: `Authorization: Bearer {token}`

### Endpoints
- **POST** `/create` - Add single order
- **POST** `/bulk-create` - Add multiple orders (max 100)
- **POST** `/etat` - Check order status
- **POST** `/filter` - Filter orders with pagination

### Rate Limiting
- **Single orders**: 1 request per second
- **Bulk orders**: 2 requests every 10 seconds

### Order Format
```json
{
  "Client": {
    "nom": "customer name",
    "gouvernerat": "governorate",
    "ville": "city",
    "adresse": "address",
    "telephone": "phone",
    "telephone2": "phone2"
  },
  "Produit": {
    "article": "article",
    "prix": 40,
    "designation": "product description",
    "nombreArticle": 2,
    "commentaire": "comment",
    "nombreEchange": 0
  }
}
```

## Troubleshooting

### Common Issues

1. **Orders not loading**: Check Shopify webhook configuration
2. **First Delivery integration failing**: Check API token and base URL
3. **Database errors**: Ensure Supabase connection and table schema
4. **Authentication issues**: Check environment variables for username/password

### Debug Mode

Enable debug logging by adding `DEBUG=true` to your environment variables.

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
2. Review the First Delivery API documentation
3. Test the integration locally
4. Contact support with specific error messages

---

**Status**: ✅ **COMPLETE** - First Delivery integration is fully implemented and ready for production use. 