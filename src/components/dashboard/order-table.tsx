'use client'

import { Order } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataQualityIndicator } from './data-quality-indicator'
import { Eye, RotateCcw, Send, AlertCircle, Package, Truck, XCircle } from 'lucide-react'

interface OrderTableProps {
  orders: Order[]
  loading: boolean
  selectedOrders: number[]
  onOrderSelect: (orderId: number, selected: boolean) => void
  onViewOrder: (order: Order) => void
  onRetryOrder: (orderId: number) => void
  onRevertOrder: (order: Order) => void
  onSendOrder: (orderId: number) => void
  sendingOrders: boolean
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
  sendingOrders
}: OrderTableProps) {
  const getStatusBadge = (status: Order['parcel_status']) => {
    const variants = {
      'Not sent': 'secondary',
      'Sent to Droppex': 'default',
      'Failed': 'destructive',
    } as const

    return <Badge variant={variants[status]}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-0 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-0 p-8">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">Try adjusting your search or filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      orders.forEach(order => onOrderSelect(order.id, true))
                    } else {
                      orders.forEach(order => onOrderSelect(order.id, false))
                    }
                  }}
                />
              </TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    <div className="font-medium text-gray-900">{order.name}</div>
                    <div className="text-sm text-gray-500">{order.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {order.customer?.first_name} {order.customer?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{order.customer?.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">
                    {(order.total_price || 0).toFixed(2)} TND
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(order.parcel_status)}
                    {order.updated_in_shopify && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        ✏️ Edited on Shopify
                      </Badge>
                    )}
                  </div>
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
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details - {order.name}</DialogTitle>
                        </DialogHeader>
                        <OrderDetails order={order} />
                      </DialogContent>
                    </Dialog>

                    {order.parcel_status === 'Failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetryOrder(order.id)}
                        disabled={sendingOrders}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}

                    {order.parcel_status === 'Not sent' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSendOrder(order.id)}
                        disabled={sendingOrders}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}

                    {order.parcel_status === 'Sent to Droppex' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRevertOrder(order)}
                        disabled={sendingOrders}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Order Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Order Number</p>
              <p className="text-gray-900">{order.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-gray-900">{(order.total_price || 0).toFixed(2)} TND</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-gray-900">{order.parcel_status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-gray-900">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            {order.updated_in_shopify && order.updated_at && (
              <div>
                <p className="text-sm font-medium text-gray-500">✏️ Edited on Shopify</p>
                <p className="text-gray-900">{new Date(order.updated_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-green-600" />
            Customer Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-gray-900">
                {order.customer?.first_name} {order.customer?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-900">{order.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-gray-900">
                {order.shipping_address?.phone || order.customer?.phone || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Truck className="h-5 w-5 mr-2 text-green-600" />
          Shipping Address
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="text-gray-900">{order.shipping_address?.address1 || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">City & Province</p>
            <p className="text-gray-900">
              {order.shipping_address?.city}, {order.shipping_address?.province}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Postal Code</p>
            <p className="text-gray-900">{order.shipping_address?.zip || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Country</p>
            <p className="text-gray-900">{order.shipping_address?.country || 'Tunisia'}</p>
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
    </div>
  )
} 