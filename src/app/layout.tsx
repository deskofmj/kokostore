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