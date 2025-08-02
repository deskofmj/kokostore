'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Send } from 'lucide-react'

interface SearchFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  selectedOrdersCount: number
  onSendSelected: () => void
  sendingOrders: boolean
}

export function SearchFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedOrdersCount,
  onSendSelected,
  sendingOrders
}: SearchFiltersProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-0 p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by order number, customer name, phone, or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-44 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New Orders</SelectItem>
              <SelectItem value="sent">Sent Orders</SelectItem>
              <SelectItem value="failed">Failed Orders</SelectItem>
            </SelectContent>
          </Select>
          {selectedOrdersCount > 0 && (
            <Button
              onClick={onSendSelected}
              disabled={sendingOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 px-6"
            >
              <Send className="w-4 h-4 mr-2" />
              Send {selectedOrdersCount} to Droppex
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 