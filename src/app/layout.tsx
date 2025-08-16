import type { Metadata } from 'next'
import { Red_Hat_Text } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'

const redHatText = Red_Hat_Text({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-red-hat-text'
})

export const metadata: Metadata = {
  title: 'Salma Collection - Order Management',
  description: 'Professional order fulfillment and management system for Salma Collection. Streamline your Shopify orders, track shipments, and manage customer deliveries with our integrated Droppex fulfillment platform.',
  icons: {
    icon: '/Favicon.png',
  },
  openGraph: {
    title: 'Salma Collection - Order Management',
    description: 'Professional order fulfillment and management system for Salma Collection. Streamline your Shopify orders, track shipments, and manage customer deliveries with our integrated Droppex fulfillment platform.',
    images: [
      {
        url: '/compressed-opengraph.webp',
        width: 1200,
        height: 630,
        alt: 'Salma Collection Order Management System',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salma Collection - Order Management',
    description: 'Professional order fulfillment and management system for Salma Collection. Streamline your Shopify orders, track shipments, and manage customer deliveries with our integrated Droppex fulfillment platform.',
    images: ['/compressed-opengraph.webp'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={redHatText.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 