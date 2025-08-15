'use client'

import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { getOrderDataQuality } from '@/lib/data-mapping'
import { Order } from '@/lib/supabase'

interface DataQualityIndicatorProps {
  order: Order
  showDetails?: boolean
}

export function DataQualityIndicator({ order, showDetails = false }: DataQualityIndicatorProps) {
  const quality = getOrderDataQuality(order)
  
  if (quality.qualityScore === 100) {
    return (
      <div className="flex items-center space-x-1">
        <CheckCircle className="h-3 w-3 text-green-500" />
        <span className="text-xs text-green-600">Complete</span>
      </div>
    )
  }
  
  if (quality.hasIssues) {
    return (
      <div className="flex items-center space-x-1">
        <XCircle className="h-3 w-3 text-red-500" />
        <span className="text-xs text-red-600">Issues</span>
        {showDetails && (
          <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-900 mb-2">Data Quality Issues:</div>
            <ul className="space-y-1">
              {quality.issues.map((issue, index) => (
                <li key={index} className="text-xs text-red-600 flex items-center">
                  <XCircle className="h-2 w-2 mr-1" />
                  {issue}
                </li>
              ))}
              {quality.warnings.map((warning, index) => (
                <li key={index} className="text-xs text-yellow-600 flex items-center">
                  <AlertCircle className="h-2 w-2 mr-1" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  
  if (quality.hasWarnings) {
    return (
      <div className="flex items-center space-x-1">
        <AlertCircle className="h-3 w-3 text-yellow-500" />
        <span className="text-xs text-yellow-600">Warnings</span>
        {showDetails && (
          <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-900 mb-2">Data Quality Warnings:</div>
            <ul className="space-y-1">
              {quality.warnings.map((warning, index) => (
                <li key={index} className="text-xs text-yellow-600 flex items-center">
                  <AlertCircle className="h-2 w-2 mr-1" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="flex items-center space-x-1">
      <CheckCircle className="h-3 w-3 text-green-500" />
      <span className="text-xs text-green-600">Good</span>
    </div>
  )
} 