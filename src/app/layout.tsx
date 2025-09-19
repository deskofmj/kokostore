import type { Metadata } from 'next'
import { Red_Hat_Text } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from '@/components/ui/toaster'

const redHatText = Red_Hat_Text({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-red-hat-text'
})

export const metadata: Metadata = {
  title: 'Koko Store - Order Management',
  description: 'Professional order fulfillment and management system for Koko Store. Streamline your Shopify orders, track shipments, and manage customer deliveries with our integrated First Delivery fulfillment platform.',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'Koko Store - Order Management',
    description: 'Professional order fulfillment and management system for Koko Store. Streamline your Shopify orders, track shipments, and manage customer deliveries with our integrated First Delivery fulfillment platform.',
    images: [
      {
        url: '/compressed-opengraph image.webp',
        width: 1200,
        height: 630,
        alt: 'Koko Store Order Management System',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Koko Store - Order Management',
    description: 'Professional order fulfillment and management system for Koko Store. Streamline your Shopify orders, track shipments, and manage customer deliveries with our integrated First Delivery fulfillment platform.',
    images: ['/compressed-opengraph image.webp'],
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
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
} 