'use client'

import { Wifi, WifiOff } from 'lucide-react'

interface StatusIndicatorsProps {
  statusLoading: boolean
  firstDeliveryStatus: {
    connected: boolean;
    error?: string;
  } | null
  shopifyStatus: { connected: boolean; message?: string }
}

export function StatusIndicators({ statusLoading, firstDeliveryStatus, shopifyStatus }: StatusIndicatorsProps) {
  return (
    <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">FIRST DELIVERY:</span>
        {statusLoading ? (
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        ) : firstDeliveryStatus?.connected ? (
          <div title="First Delivery API Connected">
            <Wifi className="w-4 h-4 text-green-500" />
          </div>
        ) : (
          <div title={`First Delivery API Disconnected: ${firstDeliveryStatus?.error}`}>
            <WifiOff className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">SHOPIFY:</span>
        {shopifyStatus.connected ? (
          <div title="Shopify Connected">
            <Wifi className="w-4 h-4 text-green-500" />
          </div>
        ) : (
          <div title={`Shopify Disconnected: ${shopifyStatus.message}`}>
            <WifiOff className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
    </div>
  )
} 