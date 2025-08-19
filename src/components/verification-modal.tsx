'use client'

import { useState, useEffect } from 'react'
import { Order } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Check, 
  X, 
  AlertCircle,
  Loader2,
  Send
} from 'lucide-react'

interface EditableOrder extends Order {
  isEditing?: boolean
  editedCustomer?: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
  }
  editedShipping?: {
    name?: string
    address1?: string
    address2?: string
    city?: string
    province?: string
    zip?: string
    country?: string
    phone?: string
  }
}

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  orders: Order[]
  onSendToDroppex: (orderIds: number[]) => Promise<void>
  sendingOrders: boolean
}

export function VerificationModal({ 
  isOpen, 
  onClose, 
  orders, 
  onSendToDroppex, 
  sendingOrders 
}: VerificationModalProps) {
  const [editableOrders, setEditableOrders] = useState<EditableOrder[]>([])
  const [errors, setErrors] = useState<Record<number, string[]>>({})

  // Initialize editable orders when modal opens
  useEffect(() => {
    if (isOpen && orders.length > 0) {
      setEditableOrders(orders.map(order => ({
        ...order,
        isEditing: false,
        editedCustomer: undefined,
        editedShipping: undefined
      })))
      setErrors({})
    }
  }, [isOpen, orders])

  const totalValue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0)

  const handleEditOrder = (orderId: number) => {
    setEditableOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order
      
      // Initialize edited values with current values to prevent fields from going blank
      const editedOrder: EditableOrder = {
        ...order,
        isEditing: true,
        editedCustomer: {
          first_name: (order.customer?.first_name as string) || '',
          last_name: (order.customer?.last_name as string) || '',
          email: (order.customer?.email as string) || order.email || '',
          phone: (order.customer?.phone as string) || (order.shipping_address?.phone as string) || ''
        },
        editedShipping: {
          name: (order.shipping_address?.name as string) || '',
          address1: (order.shipping_address?.address1 as string) || '',
          address2: (order.shipping_address?.address2 as string) || '',
          city: (order.shipping_address?.city as string) || '',
          province: (order.shipping_address?.province as string) || 'Tunis',
          zip: (order.shipping_address?.zip as string) || '',
          country: (order.shipping_address?.country as string) || '',
          phone: (order.shipping_address?.phone as string) || (order.customer?.phone as string) || ''
        }
      }
      return editedOrder
    }))
  }

  const handleSaveOrder = (orderId: number) => {
    const order = editableOrders.find(o => o.id === orderId)
    if (!order) return

    // Validate the order
    const validationErrors = validateOrder(order)
    if (validationErrors.length > 0) {
      setErrors(prev => ({ ...prev, [orderId]: validationErrors }))
      return
    }

    // Save changes
    setEditableOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { 
            ...o, 
            isEditing: false,
            customer: {
              ...o.customer,
              ...o.editedCustomer
            },
            shipping_address: {
              ...o.shipping_address,
              ...o.editedShipping
            }
          }
        : o
    ))
    setErrors(prev => ({ ...prev, [orderId]: [] }))
  }

  const handleCancelEdit = (orderId: number) => {
    setEditableOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            isEditing: false,
            editedCustomer: undefined,
            editedShipping: undefined
          }
        : order
    ))
    setErrors(prev => ({ ...prev, [orderId]: [] }))
  }

  const handleFieldChange = (orderId: number, field: string, value: string) => {
    setEditableOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order

      if (field.startsWith('customer.')) {
        const customerField = field.replace('customer.', '')
        return {
          ...order,
          editedCustomer: {
            ...order.editedCustomer,
            [customerField]: value
          }
        }
      }

      if (field.startsWith('shipping.')) {
        const shippingField = field.replace('shipping.', '')
        return {
          ...order,
          editedShipping: {
            ...order.editedShipping,
            [shippingField]: value
          }
        }
      }

      return order
    }))
  }

  const validateOrder = (order: EditableOrder): string[] => {
    const errors: string[] = []
    const customer = order.editedCustomer || order.customer
    const shipping = order.editedShipping || order.shipping_address

    // Customer validation - be more flexible with name sources
    const customerName = shipping?.name || 
                        `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() ||
                        order.email // Use email as fallback for name
    if (!customerName || customerName === '') {
      errors.push('Customer name is required')
    }
    
    // Email validation - optional since Droppex doesn't require it
    const email = (customer?.email as string) || order.email
    if (email?.trim()) {
      // Only validate format if email is provided
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push('Invalid email format')
      }
    }
    // No error if email is missing - it's optional for Droppex
    
    // Phone validation - be more flexible
    const phone = (customer?.phone as string) || (shipping?.phone as string) || (order.customer?.phone as string)
    if (!phone?.trim()) {
      errors.push('Phone is required')
    } else {
      // Phone format validation (basic)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Invalid phone format')
      }
    }
    
    // Shipping validation - be more flexible
    const address = (shipping?.address1 as string) || (order.shipping_address?.address1 as string)
    if (!address?.trim()) {
      errors.push('Address is required')
    }
    
    const city = (shipping?.city as string) || (order.shipping_address?.city as string)
    if (!city?.trim()) {
      errors.push('City is required')
    }
    
    // Province validation - be more flexible and provide default
    const province = (shipping?.province as string) || (order.shipping_address?.province as string)
    if (!province?.trim()) {
      // Don't error, just warn - we'll use default
      console.warn(`No province provided for order ${order.id}, will use default`)
    }
    
    const zipCode = (shipping?.zip as string) || (order.shipping_address?.zip as string)
    if (!zipCode?.trim()) {
      // Don't error, just warn - ZIP code is optional for Droppex
      console.warn(`No ZIP code provided for order ${order.id}, will send empty to Droppex`)
    }

    return errors
  }

  const handleSendToDroppex = async () => {
    // Validate all orders before sending - but be more lenient
    const allErrors: Record<number, string[]> = {}
    let hasCriticalErrors = false

    editableOrders.forEach(order => {
      const orderErrors = validateOrder(order)
      // Only block on critical errors (missing required fields)
      const criticalErrors = orderErrors.filter(error => 
        error.includes('required') && 
        !error.includes('Province') // Don't block on missing province
      )
      
      if (criticalErrors.length > 0) {
        allErrors[order.id] = criticalErrors
        hasCriticalErrors = true
      } else if (orderErrors.length > 0) {
        // Show warnings but don't block
        console.warn(`Order ${order.id} has warnings:`, orderErrors)
      }
    })

    if (hasCriticalErrors) {
      setErrors(allErrors)
      return
    }

    // Create updated orders with edited data
    const updatedOrders = editableOrders.map(order => {
      const updatedOrder = { ...order }
      
      if (order.editedCustomer) {
        updatedOrder.customer = {
          ...updatedOrder.customer,
          ...order.editedCustomer
        }
      }
      
      if (order.editedShipping) {
        updatedOrder.shipping_address = {
          ...updatedOrder.shipping_address,
          ...order.editedShipping
        }
      }
      
      return updatedOrder
    })

    // Update the orders in the database before sending
    try {
      const response = await fetch('/api/update-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: updatedOrders }),
      })

      if (!response.ok) {
        throw new Error('Failed to update orders')
      }
    } catch (error) {
      console.error('Error updating orders:', error)
      setErrors({ 0: ['Failed to update orders before sending'] })
      return
    }

    await onSendToDroppex(orders.map(o => o.id))
    onClose()
  }

  const hasChanges = editableOrders.some(order => 
    order.editedCustomer || order.editedShipping
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-2xl font-bold">
            <div className="bg-black p-2 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span>Review & Send to Droppex</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Summary */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-black p-2 rounded-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-gray-900">
                      {orders.length} order{orders.length !== 1 ? 's' : ''} selected
                    </span>
                    <p className="text-sm text-gray-600">Ready to send to Droppex</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                  <span className="text-sm text-gray-600">Total Value</span>
                  <p className="text-xl font-bold text-gray-900">{totalValue.toFixed(2)} TND</p>
                </div>
              </div>
              {hasChanges && (
                <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-100 px-3 py-1">
                  ✏️ Modified
                </Badge>
              )}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {editableOrders.map((order) => {
              const customer = order.editedCustomer || order.customer
              const shipping = order.editedShipping || order.shipping_address
              const orderErrors = errors[order.id] || []
              
              // Better customer name handling - prioritize edited values
              const customerName = order.isEditing 
                ? (order.editedShipping?.name || order.shipping_address?.name || 
                   `${order.editedCustomer?.first_name || order.customer?.first_name || ''} ${order.editedCustomer?.last_name || order.customer?.last_name || ''}`.trim() ||
                   order.email)
                : (shipping?.name as string) || 
                  `${(customer?.first_name as string) || ''} ${(customer?.last_name as string) || ''}`.trim() ||
                  order.email
              
              // Better email handling - prioritize edited values
              const email = order.isEditing 
                ? (order.editedCustomer?.email || order.customer?.email || order.email || '')
                : (customer?.email as string) || order.email
              
              // Better phone handling - prioritize edited values
              const phone = order.isEditing
                ? (order.editedCustomer?.phone || order.editedShipping?.phone || order.customer?.phone || order.shipping_address?.phone || '')
                : (customer?.phone as string) || (shipping?.phone as string) || (order.customer?.phone as string)
              
              // Better address handling - prioritize edited values
              const address = order.isEditing
                ? (order.editedShipping?.address1 || order.shipping_address?.address1 || '')
                : (shipping?.address1 as string) || (order.shipping_address?.address1 as string)
              const city = order.isEditing
                ? (order.editedShipping?.city || order.shipping_address?.city || '')
                : (shipping?.city as string) || (order.shipping_address?.city as string)
              const province = order.isEditing
                ? (order.editedShipping?.province || order.shipping_address?.province || 'Tunis')
                : (shipping?.province as string) || (order.shipping_address?.province as string) || 'Tunis'
              const zipCode = order.isEditing
                ? (order.editedShipping?.zip || order.shipping_address?.zip || '')
                : (shipping?.zip as string) || (order.shipping_address?.zip as string)

              return (
                <div key={order.id} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 space-y-6 hover:border-gray-400 transition-colors">
                  {/* Order Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-black p-2 rounded-lg">
                        <span className="font-bold text-white">#{order.id}</span>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          Order #{order.id}
                        </span>
                        <p className="text-sm text-gray-600">{(order.total_price || 0).toFixed(2)} TND</p>
                      </div>
                      {order.editedCustomer || order.editedShipping ? (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                          ✏️ Modified
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center space-x-2">
                      {order.isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveOrder(order.id)}
                            className="bg-black hover:bg-gray-800 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelEdit(order.id)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditOrder(order.id)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Errors */}
                  {orderErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {orderErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-600" />
                        Customer Information
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`name-${order.id}`} className="text-xs font-medium text-gray-600">
                            Name
                          </Label>
                          {order.isEditing ? (
                            <Input
                              id={`name-${order.id}`}
                              value={(order.editedShipping?.name as string) || (order.shipping_address?.name as string) || ''}
                              onChange={(e) => handleFieldChange(order.id, 'shipping.name', e.target.value)}
                              className="h-9 mt-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 text-sm mt-1 p-2 bg-white rounded border border-gray-200">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{customerName}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`email-${order.id}`} className="text-xs font-medium text-gray-600">
                            Email
                          </Label>
                          {order.isEditing ? (
                            <Input
                              id={`email-${order.id}`}
                              type="email"
                              value={(order.editedCustomer?.email as string) || (order.customer?.email as string) || order.email || ''}
                              onChange={(e) => handleFieldChange(order.id, 'customer.email', e.target.value)}
                              className="h-9 mt-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 text-sm mt-1 p-2 bg-white rounded border border-gray-200">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{email}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`phone-${order.id}`} className="text-xs font-medium text-gray-600">
                            Phone
                          </Label>
                          {order.isEditing ? (
                            <Input
                              id={`phone-${order.id}`}
                              value={order.editedCustomer?.phone || order.customer?.phone || order.shipping_address?.phone || ''}
                              onChange={(e) => handleFieldChange(order.id, 'customer.phone', e.target.value)}
                              className="h-9 mt-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 text-sm mt-1 p-2 bg-white rounded border border-gray-200">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                        Shipping Address
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`address1-${order.id}`} className="text-xs font-medium text-gray-600">
                            Address
                          </Label>
                          {order.isEditing ? (
                            <Input
                              id={`address1-${order.id}`}
                              value={order.editedShipping?.address1 || order.shipping_address?.address1 || ''}
                              onChange={(e) => handleFieldChange(order.id, 'shipping.address1', e.target.value)}
                              className="h-9 mt-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                            />
                          ) : (
                            <div className="flex items-start space-x-2 text-sm mt-1 p-2 bg-white rounded border border-gray-200">
                              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                              <span className="font-medium">{address}</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor={`city-${order.id}`} className="text-xs font-medium text-gray-600">
                              City
                            </Label>
                            {order.isEditing ? (
                              <Input
                                id={`city-${order.id}`}
                                value={order.editedShipping?.city || order.shipping_address?.city || ''}
                                onChange={(e) => handleFieldChange(order.id, 'shipping.city', e.target.value)}
                                className="h-9 mt-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                              />
                            ) : (
                              <span className="text-sm mt-1 p-2 bg-white rounded border border-gray-200 block font-medium">{city}</span>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`province-${order.id}`} className="text-xs font-medium text-gray-600">
                              Province
                            </Label>
                            {order.isEditing ? (
                              <Input
                                id={`province-${order.id}`}
                                value={order.editedShipping?.province || order.shipping_address?.province || 'Tunis'}
                                onChange={(e) => handleFieldChange(order.id, 'shipping.province', e.target.value)}
                                className="h-9 mt-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                              />
                            ) : (
                              <span className="text-sm mt-1 p-2 bg-white rounded border border-gray-200 block font-medium">{province || 'Tunis'}</span>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`zip-${order.id}`} className="text-xs font-medium text-gray-600">
                              ZIP
                            </Label>
                            {order.isEditing ? (
                              <Input
                                id={`zip-${order.id}`}
                                value={order.editedShipping?.zip || order.shipping_address?.zip || ''}
                                onChange={(e) => handleFieldChange(order.id, 'shipping.zip', e.target.value)}
                                className="h-9 mt-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                              />
                            ) : (
                              <span className="text-sm mt-1 p-2 bg-white rounded border border-gray-200 block font-medium">{zipCode}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <Separator />
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-black p-2 rounded-lg">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Ready to send to Droppex</p>
                  <p className="text-xs text-gray-500">Review all information before sending</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendToDroppex}
                  disabled={sendingOrders}
                  className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-2"
                >
                  {sendingOrders ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending to Droppex...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to Droppex
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 