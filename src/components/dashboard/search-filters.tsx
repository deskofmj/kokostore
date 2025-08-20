'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface SearchFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedOrdersCount: number
  onSendSelected: () => void
  onDeleteSelected: () => void
  sendingOrders: boolean
}

export function SearchFilters({
  searchTerm,
  onSearchChange,
  selectedOrdersCount,
  onSendSelected,
  onDeleteSelected,
  sendingOrders
}: SearchFiltersProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    onDeleteSelected()
    setShowDeleteDialog(false)
  }

  return (
    <>
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
              <>
                <Button
                  onClick={onSendSelected}
                  disabled={sendingOrders}
                  className="bg-black hover:bg-gray-800 text-white font-medium h-10 sm:h-12 px-4 sm:px-6 text-sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Send {selectedOrdersCount} to Droppex</span>
                  <span className="sm:hidden">Send {selectedOrdersCount}</span>
                </Button>
                <Button
                  onClick={handleDeleteClick}
                  disabled={sendingOrders}
                  variant="destructive"
                  className="font-medium h-10 sm:h-12 px-4 sm:px-6 text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Delete {selectedOrdersCount}</span>
                  <span className="sm:hidden">Delete {selectedOrdersCount}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Orders
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedOrdersCount} selected order{selectedOrdersCount > 1 ? 's' : ''}? 
              This action cannot be undone and will permanently remove the order{selectedOrdersCount > 1 ? 's' : ''} from your database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={sendingOrders}
              className="w-full sm:w-auto"
            >
              {sendingOrders ? 'Deleting...' : `Delete ${selectedOrdersCount} Order${selectedOrdersCount > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 