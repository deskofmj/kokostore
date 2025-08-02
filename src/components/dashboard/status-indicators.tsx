'use client'

import { Wifi, WifiOff } from 'lucide-react'

interface StatusIndicatorsProps {
  statusLoading: boolean
  droppexStatus: {
    dev: { connected: boolean; error?: string };
    prod: { connected: boolean; error?: string };
    current: { connected: boolean; error?: string };
  } | null
  shopifyStatus: { connected: boolean; message?: string }
}

export function StatusIndicators({ statusLoading, droppexStatus, shopifyStatus }: StatusIndicatorsProps) {
  return (
    <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">DEV:</span>
        {statusLoading ? (
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        ) : droppexStatus?.dev.connected ? (
          <div title="Dev API Connected">
            <Wifi className="w-4 h-4 text-green-500" />
          </div>
        ) : (
          <div title={`Dev API Disconnected: ${droppexStatus?.dev.error}`}>
            <WifiOff className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">PROD:</span>
        {statusLoading ? (
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        ) : droppexStatus?.prod.connected ? (
          <div title="Prod API Connected">
            <Wifi className="w-4 h-4 text-green-500" />
          </div>
        ) : (
          <div title={`Prod API Disconnected: ${droppexStatus?.prod.error}`}>
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