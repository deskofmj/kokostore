'use client'

import { Order } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { DataQualityIndicator } from './data-quality-indicator'
import { getGovernorateFromPostalCode } from '@/lib/postal-codes'
import { Eye, RotateCcw, Send, AlertCircle, Package, Truck, XCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/lib/use-toast'

// Helper function to get the best available customer name
function getCustomerName(order: Order): string {
  // Try shipping address name first
  if (order.shipping_address?.name) {
    return order.shipping_address.name as string
  }
  
  // Try customer first_name + last_name
  const firstName = order.customer?.first_name as string || ''
  const lastName = order.customer?.last_name as string || ''
  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) {
    return fullName
  }
  
  // Try email as fallback
  if (order.email) {
    return order.email
  }
  
  // Try order name as last resort (only if it's meaningful)
  if (order.name && !order.name.startsWith('#')) {
    return order.name
  }
  
  // If we have no meaningful customer information, show N/A
  return 'N/A'
}

// Helper function to get the best available phone number
function getCustomerPhone(order: Order): string {
  return (order.shipping_address?.phone as string) || 
         (order.customer?.phone as string) || 
         'N/A'
}

// Helper function to detect governorate from address information
function getDetectedGovernorate(order: Order): { governorate: string, method: string } {
  const address = order.shipping_address?.address1 || ''
  const city = order.shipping_address?.city || ''
  const zipCode = order.shipping_address?.zip || ''
  const province = order.shipping_address?.province || ''
  
      // Method 1: Postal code detection (most accurate)
    if (zipCode) {
      const governorateFromPostal = getGovernorateFromPostalCode(zipCode as string)
      if (governorateFromPostal) {
        return { governorate: governorateFromPostal, method: 'postal_code' }
      }
    }
  
  // Method 2: Check if province is already a valid governorate
  const governorateMap: Record<string, string> = {
    'Tunis': 'Tunis',
    'Sousse': 'Sousse', 
    'Monastir': 'Monastir',
    'Mahdia': 'Mahdia',
    'Sfax': 'Sfax',
    'Gabès': 'Gabès',
    'Médenine': 'Médenine',
    'Gafsa': 'Gafsa',
    'Tozeur': 'Tozeur',
    'Kébili': 'Kébili',
    'Kairouan': 'Kairouan',
    'Kasserine': 'Kasserine',
    'Sidi Bouzid': 'Sidi Bouzid',
    'Zaghouan': 'Zaghouan',
    'Nabeul': 'Nabeul',
    'Béja': 'Béja',
    'Jendouba': 'Jendouba',
    'Le Kef': 'Le Kef',
    'Siliana': 'Siliana',
    'Bizerte': 'Bizerte',
    'Béni Arous': 'Béni Arous',
    'Ariana': 'Ariana',
    'Manouba': 'Manouba',
    'Tataouine': 'Tataouine'
  }
  
      // If province is already a valid governorate, use it
    if (province && governorateMap[province as string]) {
      return { governorate: governorateMap[province as string], method: 'province' }
    }
  
  // Method 3: Detect from city name (enhanced with more variations)
  const cityToGovernorate: Record<string, string> = {
    'tunis': 'Tunis',
    'la marsa': 'Tunis',
    'carthage': 'Tunis',
    'sidi bou said': 'Tunis',
    'le bardo': 'Tunis',
    'ariana': 'Ariana',
    'la soukra': 'Ariana',
    'raoued': 'Ariana',
    'sousse': 'Sousse',
    'hammam sousse': 'Sousse',
    'kantaoui': 'Sousse',
    'msaken': 'Sousse',
    'enfidha': 'Sousse',
    'monastir': 'Monastir',
    'moknine': 'Monastir',
    'jemmal': 'Monastir',
    'mahdia': 'Mahdia',
    'rejiche': 'Mahdia',
    'sfax': 'Sfax',
    'sakiet ezzit': 'Sfax',
    'thyna': 'Sfax',
    
    // Gabès Governorate (enhanced with variations)
    'gabès': 'Gabès',
    'gabes': 'Gabès', // Handle non-accented version
    'métouia': 'Gabès',
    'metouia': 'Gabès', // Handle non-accented version
    'el hamma': 'Gabès',
    'mareth': 'Gabès',
    'ghannouche': 'Gabès',
    'matmata': 'Gabès',
    'menzel habib': 'Gabès',
    
    // Médenine Governorate
    'médenine': 'Médenine',
    'medenine': 'Médenine', // Handle non-accented version
    'zarzis': 'Médenine',
    'djerba': 'Médenine',
    'houmet souk': 'Médenine',
    'midoun': 'Médenine',
    
    // Other major cities
    'gafsa': 'Gafsa',
    'tozeur': 'Tozeur',
    'kébili': 'Kébili',
    'kebili': 'Kébili', // Handle non-accented version
    'kairouan': 'Kairouan',
    'kasserine': 'Kasserine',
    'sidi bouzid': 'Sidi Bouzid',
    'zaghouan': 'Zaghouan',
    'nabeul': 'Nabeul',
    'hammamet': 'Nabeul',
    'béja': 'Béja',
    'beja': 'Béja', // Handle non-accented version
    'jendouba': 'Jendouba',
    'le kef': 'Le Kef',
    'siliana': 'Siliana',
    'bizerte': 'Bizerte',
    'béni arous': 'Béni Arous',
    'beni arous': 'Béni Arous', // Handle non-accented version
    'manouba': 'Manouba',
    'tataouine': 'Tataouine'
  }
  
      const normalizedCity = (city as string).toLowerCase().trim()
    if (cityToGovernorate[normalizedCity]) {
      return { governorate: cityToGovernorate[normalizedCity], method: 'city' }
    }
  
      // Method 4: Search in address text
    const addressText = `${address} ${city} ${province}`.toLowerCase()
    for (const [governorateName, governorateValue] of Object.entries(governorateMap)) {
      if (addressText.includes(governorateName.toLowerCase())) {
        return { governorate: governorateValue, method: 'address_text' }
      }
    }
    
    // Default fallback
    return { governorate: 'Tunis', method: 'default' }
}

interface OrderTableProps {
  orders: Order[]
  loading: boolean
  selectedOrders: number[]
  onOrderSelect: (orderId: number, selected: boolean) => void
  onViewOrder: (order: Order) => void
  onRetryOrder: (orderId: number) => void
  onRevertOrder: (order: Order) => void
  onSendOrder: (orderId: number) => void
  onDeleteOrder: (orderId: number) => void
  sendingOrders: boolean
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export function OrderTable({
  orders,
  loading,
  selectedOrders,
  onOrderSelect,
  onViewOrder,
  onRetryOrder,
  onRevertOrder,
  onSendOrder,
  onDeleteOrder,
  sendingOrders,
  currentPage,
  totalPages,
  onPageChange
}: OrderTableProps) {
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleDeleteClick = (orderId: number) => {
    setDeleteOrderId(orderId)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    if (deleteOrderId) {
      onDeleteOrder(deleteOrderId)
      setShowDeleteDialog(false)
      setDeleteOrderId(null)
    }
  }
  const getStatusBadge = (status: Order['parcel_status']) => {
    const variants = {
      'Not sent': 'secondary',
              'Sent to First Delivery': 'default',
      'Failed': 'destructive',
    } as const

    const shortLabels = {
      'Not sent': 'New',
              'Sent to First Delivery': 'Sent',
      'Failed': 'Failed',
    } as const

    return (
      <Badge 
        variant={variants[status]}
        className="text-xs px-1.5 py-0.5 w-fit"
      >
        {shortLabels[status]}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border-0 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-0 p-8">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">Try adjusting your search or filters.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border-0 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-10 sm:w-12">
                <Checkbox
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      orders.forEach(order => onOrderSelect(order.id, true))
                    } else {
                      orders.forEach(order => onOrderSelect(order.id, false))
                      if (selectedOrders.length > 0) {
                        toast({
                          title: 'Selection cleared',
                          description: 'All orders have been deselected.',
                          variant: 'info',
                        })
                      }
                    }
                  }}
                />
              </TableHead>
              <TableHead className="text-xs sm:text-sm">Order</TableHead>
              <TableHead className="text-xs sm:text-sm">Customer</TableHead>
              <TableHead className="text-xs sm:text-sm">Governorate</TableHead>
              <TableHead className="text-xs sm:text-sm">Total</TableHead>
              <TableHead className="text-xs sm:text-sm w-20">Status</TableHead>
              <TableHead className="text-xs sm:text-sm">Quality</TableHead>
              <TableHead className="text-xs sm:text-sm">Created</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) => onOrderSelect(order.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900 text-xs sm:text-sm">{order.name}</div>
                    <div className="text-xs text-gray-500 hidden sm:block">{order.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900 text-xs sm:text-sm">
                      {getCustomerName(order)}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {getCustomerPhone(order)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900 text-xs sm:text-sm flex items-center">
                      {(() => {
                        const detection = getDetectedGovernorate(order)
                        const methodText = detection.method === 'postal_code' ? 'Postal' :
                                          detection.method === 'city' ? 'City' :
                                          detection.method === 'province' ? 'Province' :
                                          detection.method === 'postal_range' ? 'Range' :
                                          detection.method === 'address_text' ? 'Address' : 'Default'
                        return (
                          <>
                            {detection.governorate}
                            {!order.shipping_address?.province && (
                              <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {methodText}
                              </Badge>
                            )}
                          </>
                        )
                      })()}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {order.shipping_address?.province ? 
                        `Provided: ${order.shipping_address.province as string}` : 
                        (() => {
                          const detection = getDetectedGovernorate(order)
                          const methodText = detection.method === 'postal_code' ? 'from postal code' :
                                            detection.method === 'city' ? 'from city' :
                                            detection.method === 'province' ? 'from province' :
                                            detection.method === 'postal_range' ? 'from postal code range' :
                                            detection.method === 'address_text' ? 'from address text' : 'as default'
                          return `Auto-detected ${methodText}`
                        })()
                      }
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900 text-xs sm:text-sm">
                    {(order.total_price || 0).toFixed(2)} TND
                  </div>
                </TableCell>
                <TableCell className="w-20">
                  {getStatusBadge(order.parcel_status)}
                </TableCell>
                <TableCell>
                  <DataQualityIndicator order={order} />
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewOrder(order)}
                          className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details - {order.name}</DialogTitle>
                        </DialogHeader>
                        <OrderDetails 
                          order={order} 
                          onSendOrder={onSendOrder}
                          onRetryOrder={onRetryOrder}
                          onRevertOrder={onRevertOrder}
                          sendingOrders={sendingOrders}
                        />
                      </DialogContent>
                    </Dialog>

                    {order.parcel_status === 'Failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetryOrder(order.id)}
                        disabled={sendingOrders}
                        className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
                      >
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Retry</span>
                      </Button>
                    )}

                    {order.parcel_status === 'Not sent' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSendOrder(order.id)}
                        disabled={sendingOrders}
                        className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
                      >
                        <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                    )}

                    {order.parcel_status === 'Sent to First Delivery' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRevertOrder(order)}
                        disabled={sendingOrders}
                        className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
                      >
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Revert</span>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(order.id)}
                      disabled={sendingOrders}
                      className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="border-t border-gray-100 px-4 sm:px-6 py-4">
          <Pagination
            currentPage={currentPage || 1}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Delete Order
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this order? This action cannot be undone and will permanently remove the order from your database.
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
            {sendingOrders ? 'Deleting...' : 'Delete Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}

function OrderDetails({ 
  order, 
  onSendOrder, 
  onRetryOrder, 
  onRevertOrder, 
  sendingOrders 
}: { 
  order: Order
  onSendOrder?: (orderId: number) => void
  onRetryOrder?: (orderId: number) => void
  onRevertOrder?: (order: Order) => void
  sendingOrders?: boolean
}) {
  // Get product details for display
  const getProductDetails = () => {
    if (order.line_items && order.line_items.length > 0) {
      return order.line_items.map((item: Record<string, unknown>, index: number) => {
        const title = (item.title as string) || (item.name as string) || 'Unknown Product'
        const quantity = Number(item.quantity) || 1
        const variant = (item.variant_title as string) || ''
        const price = Number(item.price) || 0
        const sku = (item.sku as string) || ''
        
        return {
          title,
          quantity,
          variant,
          price,
          sku,
          total: price * quantity
        }
      })
    }
    return []
  }

  const products = getProductDetails()
  const totalItems = products.reduce((sum, product) => sum + product.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Product Details - Moved to top */}
      {products.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Package className="h-6 w-6 mr-3 text-gray-600" />
            Product Details
            <Badge variant="secondary" className="ml-3 bg-gray-200 text-gray-800">
              {products.length} product{products.length !== 1 ? 's' : ''}
            </Badge>
          </h3>
          <div className="space-y-4">
            {products.map((product, index) => (
              <div key={index} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{product.title}</h4>
                    {product.variant && (
                      <div className="flex items-center mb-2">
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                          {product.variant}
                        </Badge>
                      </div>
                    )}
                    {product.sku && (
                      <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                        SKU: {product.sku}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-6 min-w-[120px]">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-lg font-bold text-gray-900 mb-1">x{product.quantity}</p>
                      <p className="text-sm text-gray-600 mb-1">{Number(product.price).toFixed(2)} TND each</p>
                      <p className="text-lg font-bold text-gray-900">{Number(product.total).toFixed(2)} TND</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Order Total Summary */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-300 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Order Total</span>
                <span className="text-2xl font-bold text-gray-900">{(order.total_price || 0).toFixed(2)} TND</span>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                <span>Total Items: {totalItems}</span>
                <span>Products: {products.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-gray-600" />
            Order Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Order Number</p>
              <p className="text-gray-900 font-semibold">{order.name}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant={order.parcel_status === 'Failed' ? 'destructive' : order.parcel_status === 'Sent to First Delivery' ? 'default' : 'secondary'}>
                {order.parcel_status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-gray-900">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            {order.updated_in_shopify && order.updated_at && (
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-500">✏️ Edited on Shopify</p>
                <p className="text-gray-900">{new Date(order.updated_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-gray-600" />
            Customer Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-gray-900 font-semibold">
                {getCustomerName(order)}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-900">{order.email}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-gray-900">
                {getCustomerPhone(order)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Truck className="h-5 w-5 mr-2 text-gray-600" />
          Shipping Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
            <p className="text-gray-900 font-medium">{order.shipping_address?.address1 as string || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">City & Province</p>
            <p className="text-gray-900 font-medium">
              {order.shipping_address?.city as string || 'N/A'}, {order.shipping_address?.province as string || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Governorate</p>
            <p className="text-gray-900 font-medium">
              {(() => {
                const detection = getDetectedGovernorate(order)
                return (
                  <>
                    {detection.governorate}
                    {order.shipping_address?.province && 
                      order.shipping_address.province !== detection.governorate && 
                      <span className="text-orange-600 text-xs ml-2">(mismatch)</span>
                    }
                  </>
                )
              })()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Postal Code</p>
            <p className="text-gray-900 font-medium flex items-center">
              {order.shipping_address?.zip as string || 'N/A'}
              {!order.shipping_address?.zip && (
                <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-200">
                  Missing
                </Badge>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Country</p>
            <p className="text-gray-900 font-medium">{order.shipping_address?.country as string || 'Tunisia'}</p>
          </div>
        </div>
      </div>

      {/* Order Notes */}
      {order.note && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
            Order Notes
          </h3>
          <p className="text-gray-800">{order.note}</p>
        </div>
      )}

      {/* Action Buttons */}
      {onSendOrder && onRetryOrder && onRevertOrder && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {order.parcel_status === 'Not sent' && (
            <Button
              onClick={() => onSendOrder(order.id)}
              disabled={sendingOrders}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingOrders ? 'Sending...' : 'Send to First Delivery'}
            </Button>
          )}
          {order.parcel_status === 'Failed' && (
            <Button
              onClick={() => onRetryOrder(order.id)}
              disabled={sendingOrders}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {sendingOrders ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          {order.parcel_status === 'Sent to First Delivery' && (
            <Button
              onClick={() => onRevertOrder(order)}
              disabled={sendingOrders}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {sendingOrders ? 'Reverting...' : 'Revert Order'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 