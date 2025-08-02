'use client'

import { useState } from 'react'
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
    name: string
    email: string
    phone: string
  }
  editedShipping?: {
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
    country: string
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
  useState(() => {
    if (isOpen && orders.length > 0) {
      setEditableOrders(orders.map(order => ({
        ...order,
        isEditing: false,
        editedCustomer: undefined,
        editedShipping: undefined
      })))
    }
  })

  const totalValue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0)

  const handleEditOrder = (orderId: number) => {
    setEditableOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, isEditing: true }
        : order
    ))
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
            customer: o.editedCustomer || o.customer,
            shipping_address: o.editedShipping || o.shipping_address
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
            ...order.customer,
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
            ...order.shipping_address,
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

    if (!customer.name?.trim()) errors.push('Customer name is required')
    if (!customer.email?.trim()) errors.push('Email is required')
    if (!customer.phone?.trim()) errors.push('Phone is required')
    if (!shipping.address1?.trim()) errors.push('Address is required')
    if (!shipping.city?.trim()) errors.push('City is required')
    if (!shipping.state?.trim()) errors.push('State is required')
    if (!shipping.zip?.trim()) errors.push('ZIP code is required')

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (customer.email && !emailRegex.test(customer.email)) {
      errors.push('Invalid email format')
    }

    // Phone format validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (customer.phone && !phoneRegex.test(customer.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Invalid phone format')
    }

    return errors
  }

  const handleSendToDroppex = async () => {
    // Validate all orders before sending
    const allErrors: Record<number, string[]> = {}
    let hasErrors = false

    editableOrders.forEach(order => {
      const orderErrors = validateOrder(order)
      if (orderErrors.length > 0) {
        allErrors[order.id] = orderErrors
        hasErrors = true
      }
    })

    if (hasErrors) {
      setErrors(allErrors)
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Review & Send to Droppex</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {orders.length} order{orders.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  ${totalValue.toFixed(2)}
                </Badge>
              </div>
              {hasChanges && (
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  Modified
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

              return (
                <div key={order.id} className="border rounded-lg p-4 space-y-4">
                  {/* Order Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                                             <span className="font-medium text-gray-900">
                         Order #{order.id}
                       </span>
                      {order.editedCustomer || order.editedShipping ? (
                        <Badge variant="outline" className="text-xs">
                          Modified
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center space-x-2">
                      {order.isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveOrder(order.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelEdit(order.id)}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Customer Information
                      </Label>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`name-${order.id}`} className="text-xs">
                            Name
                          </Label>
                          {order.isEditing ? (
                            <Input
                              id={`name-${order.id}`}
                              value={customer.name || ''}
                              onChange={(e) => handleFieldChange(order.id, 'customer.name', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>{customer.name}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`email-${order.id}`} className="text-xs">
                            Email
                          </Label>
                          {order.isEditing ? (
                            <Input
                              id={`email-${order.id}`}
                              type="email"
                              value={customer.email || ''}
                              onChange={(e) => handleFieldChange(order.id, 'customer.email', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`phone-${order.id}`} className="text-xs">
                            Phone
                          </Label>
                          {order.isEditing ? (
                            <Input
                              id={`phone-${order.id}`}
                              value={customer.phone || ''}
                              onChange={(e) => handleFieldChange(order.id, 'customer.phone', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Shipping Address
                      </Label>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`address1-${order.id}`} className="text-xs">
                            Address
                          </Label>
                          {order.isEditing ? (
                            <Input
                              id={`address1-${order.id}`}
                              value={shipping.address1 || ''}
                              onChange={(e) => handleFieldChange(order.id, 'shipping.address1', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <div className="flex items-start space-x-2 text-sm">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span>{shipping.address1}</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor={`city-${order.id}`} className="text-xs">
                              City
                            </Label>
                            {order.isEditing ? (
                              <Input
                                id={`city-${order.id}`}
                                value={shipping.city || ''}
                                onChange={(e) => handleFieldChange(order.id, 'shipping.city', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <span className="text-sm">{shipping.city}</span>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`state-${order.id}`} className="text-xs">
                              State
                            </Label>
                            {order.isEditing ? (
                              <Input
                                id={`state-${order.id}`}
                                value={shipping.state || ''}
                                onChange={(e) => handleFieldChange(order.id, 'shipping.state', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <span className="text-sm">{shipping.state}</span>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`zip-${order.id}`} className="text-xs">
                              ZIP
                            </Label>
                            {order.isEditing ? (
                              <Input
                                id={`zip-${order.id}`}
                                value={shipping.zip || ''}
                                onChange={(e) => handleFieldChange(order.id, 'shipping.zip', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <span className="text-sm">{shipping.zip}</span>
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
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSendToDroppex}
              disabled={sendingOrders}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingOrders ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
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
      </DialogContent>
    </Dialog>
  )
} 