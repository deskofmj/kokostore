'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'

interface HeaderActionsProps {
  loading: boolean
  onRefresh: () => void
  onTestConnection: () => void
}

export function HeaderActions({ loading, onRefresh, onTestConnection }: HeaderActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button 
        onClick={onRefresh}
        disabled={loading}
        variant="outline"
        size="sm"
        className="border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
      
      <Button 
        onClick={onTestConnection}
        variant="outline"
        size="sm"
        className="border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        <Loader2 className="w-4 h-4 mr-2" />
        Test DB
      </Button>
    </div>
  )
} 