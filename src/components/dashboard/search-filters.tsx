'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Send } from 'lucide-react'

interface SearchFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedOrdersCount: number
  onSendSelected: () => void
  sendingOrders: boolean
}

export function SearchFilters({
  searchTerm,
  onSearchChange,
  selectedOrdersCount,
  onSendSelected,
  sendingOrders
}: SearchFiltersProps) {
  return (
    <div className="bg-white rounded-2xl border-0 p-4 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <Input
              placeholder="Search by order number, customer name, phone, or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {selectedOrdersCount > 0 && (
            <Button
              onClick={onSendSelected}
              disabled={sendingOrders}
              className="bg-black hover:bg-gray-800 text-white font-medium h-10 sm:h-12 px-4 sm:px-6 text-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Send {selectedOrdersCount} to Droppex</span>
              <span className="sm:hidden">Send {selectedOrdersCount}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 