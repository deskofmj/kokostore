'use client'

import { useState, useEffect } from 'react'
import { Order } from '@/lib/supabase'
import { useToast } from '@/lib/use-toast'

interface ShopifyStatus {
  connected: boolean;
  message?: string;
}

export function useDashboard() {
  // State
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sendingOrders, setSendingOrders] = useState(false)
  const [shopifyStatus, setShopifyStatus] = useState<ShopifyStatus>({ connected: false })
  const [activeTab, setActiveTab] = useState('new')
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [ordersToSend, setOrdersToSend] = useState<Order[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const { toast } = useToast()

  // Initialize data
  useEffect(() => {
    fetchOrders()
  }, [])

  // API Functions with caching
  const fetchOrders = async (forceRefresh = false) => {
    // Don't fetch if we already have data and it's not a forced refresh
    if (!forceRefresh && orders.length > 0 && !loading) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/shopify-orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        
        if (data.error) {
          setShopifyStatus({ connected: false, message: data.error })
          toast({
            title: 'Shopify connection error',
            description: data.error,
            variant: 'destructive',
          })
        } else if (data.message) {
          setShopifyStatus({ connected: false, message: data.message })
          // Don't show toast for webhook-only mode message in production
        } else {
          setShopifyStatus({ connected: true })
        }
      } else {
        setShopifyStatus({ connected: false, message: 'Failed to load orders' })
        toast({
          title: 'Failed to load orders',
          description: 'Unable to fetch orders from Shopify. Please check your connection.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setShopifyStatus({ connected: false, message: 'Failed to connect to Shopify' })
      toast({
        title: 'Connection error',
        description: 'Failed to connect to Shopify. Please check your internet connection.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Order Management Functions
  const handleSendToFirstDelivery = async (orderIds: number[]) => {
    setSendingOrders(true)
    try {
      const response = await fetch('/api/send-to-carrier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchOrders(true) // Force refresh orders
        setSelectedOrders([])
        
        if (data.success) {
          toast({
            title: 'Orders sent to First Delivery',
            description: `Successfully sent ${orderIds.length} orders to First Delivery.`,
            variant: 'success',
          })
        } else {
          toast({
            title: 'Failed to send orders to First Delivery',
            description: 'Failed to send orders to First Delivery. Please try again.',
            variant: 'destructive',
          })
        }
      } else {
        toast({
                  title: 'Network error sending orders to First Delivery',
        description: 'Failed to send orders to First Delivery. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending orders to First Delivery:', error)
      toast({
        title: 'Error sending orders to First Delivery',
        description: 'Failed to send orders to First Delivery. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSendingOrders(false)
    }
  }

  const handlePrepareForFirstDelivery = (orderIds: number[]) => {
    const selectedOrders = orders.filter(order => orderIds.includes(order.id))
    setOrdersToSend(selectedOrders)
    setShowVerificationModal(true)
    toast({
      title: 'Preparing orders for First Delivery',
      description: `Preparing ${selectedOrders.length} orders for verification...`,
      variant: 'info',
    })
  }

  const handleRetryFailedOrder = (orderId: number) => {
    const failedOrder = orders.find(order => order.id === orderId && order.parcel_status === 'Failed')
    if (failedOrder) {
      setOrdersToSend([failedOrder])
      setShowVerificationModal(true)
      toast({
        title: 'Retrying order',
        description: `Preparing to retry order ${failedOrder.name}...`,
        variant: 'info',
      })
    } else {
      toast({
        title: 'Order not found',
        description: 'The order you are trying to retry was not found.',
        variant: 'warning',
      })
    }
  }

  const handleRevertOrder = async (order: Order) => {
    setSendingOrders(true)
    try {
      const response = await fetch('/api/revert-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchOrders(true)
        setSelectedOrder(null)
        
        if (data.success) {
          toast({
            title: 'Order reverted',
            description: `Order ${order.name} reverted successfully.`,
            variant: 'success',
          })
        } else {
          toast({
            title: 'Failed to revert order',
            description: `Failed to revert order ${order.name}. Please try again.`,
            variant: 'destructive',
          })
        }
      } else {
        toast({
          title: 'Network error reverting order',
          description: `Failed to revert order ${order.name}. Please try again.`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error reverting order:', error)
      toast({
        title: 'Error reverting order',
        description: 'Failed to revert order. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSendingOrders(false)
    }
  }

  const handleDeleteOrders = async (orderIds: number[]) => {
    setSendingOrders(true)
    try {
      const response = await fetch('/api/delete-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchOrders(true) // Force refresh orders
        setSelectedOrders([]) // Clear selection
        
        if (data.success) {
          toast({
            title: 'Orders deleted',
            description: `Successfully deleted ${orderIds.length} orders.`,
            variant: 'success',
          })
        } else {
          toast({
            title: 'Failed to delete orders',
            description: 'Failed to delete orders. Please try again.',
            variant: 'destructive',
          })
        }
      } else {
        toast({
          title: 'Network error deleting orders',
          description: 'Failed to delete orders. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting orders:', error)
      toast({
        title: 'Error deleting orders',
        description: 'Failed to delete orders. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSendingOrders(false)
    }
  }

  // Order Selection Functions
  const handleOrderSelect = (orderId: number, selected: boolean) => {
    if (selected) {
      setSelectedOrders(prev => [...prev, orderId])
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId))
    }
  }

  const handleViewOrder = async (order: Order) => {
    try {
      // Fetch complete order details from the API
      const response = await fetch(`/api/order-details?id=${order.id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedOrder(data.order)
      } else {
        // Fallback to the order from the dashboard list
        setSelectedOrder(order)
        toast({
          title: 'Warning',
          description: 'Could not fetch complete order details. Showing limited information.',
          variant: 'warning',
        })
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      // Fallback to the order from the dashboard list
      setSelectedOrder(order)
      toast({
        title: 'Warning',
        description: 'Could not fetch complete order details. Showing limited information.',
        variant: 'warning',
      })
    }
  }

  const handleSendOrder = (orderId: number) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      handlePrepareForFirstDelivery([orderId])
      toast({
        title: 'Preparing to send order',
        description: `Preparing to send order ${order.name} to First Delivery...`,
        variant: 'info',
      })
    } else {
      toast({
        title: 'Order not found',
        description: 'The order you are trying to send was not found.',
        variant: 'warning',
      })
    }
  }

  // Filtering and Search
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase()
    
    // Search in order name
    if (order.name?.toLowerCase().includes(searchLower)) return true
    
    // Search in email
    if (order.email?.toLowerCase().includes(searchLower)) return true
    
    // Search in customer name (using same logic as display)
    const customerName = (order.shipping_address?.name as string) || 
                        `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() ||
                        order.email ||
                        (order.name && !order.name.startsWith('#') ? order.name : '')
    if (customerName.toLowerCase().includes(searchLower)) return true
    
    // Search in phone numbers
    const customerPhone = (order.customer?.phone as string) || ''
    const shippingPhone = (order.shipping_address?.phone as string) || ''
    if (customerPhone.toLowerCase().includes(searchLower) || 
        shippingPhone.toLowerCase().includes(searchLower)) return true
    
    // Search in address
    const address = (order.shipping_address?.address1 as string) || ''
    if (address.toLowerCase().includes(searchLower)) return true
    
    // Search in city
    const city = (order.shipping_address?.city as string) || ''
    if (city.toLowerCase().includes(searchLower)) return true
    
    // Search in province
    const province = (order.shipping_address?.province as string) || ''
    if (province.toLowerCase().includes(searchLower)) return true
    
    // Search in postal code
    const zipCode = (order.shipping_address?.zip as string) || ''
    if (zipCode.toLowerCase().includes(searchLower)) return true
    
    return false
  })

  const getFilteredOrdersByTab = () => {
    // Apply search filter first
    let filtered = filteredOrders
    
    // Then apply tab filter
    switch (activeTab) {
      case 'new':
        return filtered.filter(o => o.parcel_status === 'Not sent')
      case 'sent':
        return filtered.filter(o => o.parcel_status === 'Sent to First Delivery')
      case 'failed':
        return filtered.filter(o => o.parcel_status === 'Failed')
      default:
        return filtered
    }
  }

  // Statistics
  const orderStats = {
    total: orders.filter(o => o.parcel_status === 'Not sent').length, // Show only new orders
    notSent: orders.filter(o => o.parcel_status === 'Not sent').length,
    sent: orders.filter(o => o.parcel_status === 'Sent to First Delivery').length,
    failed: orders.filter(o => o.parcel_status === 'Failed').length,
  }

  const tabOrders = getFilteredOrdersByTab()
  
  // Pagination logic
  const totalPages = Math.ceil(tabOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = tabOrders.slice(startIndex, endIndex)
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeTab])

  return {
    // State
    orders,
    loading,
    searchTerm,
    selectedOrders,
    selectedOrder,
    sendingOrders,
    shopifyStatus,
    activeTab,
    showVerificationModal,
    ordersToSend,
    tabOrders: paginatedOrders,
    orderStats,
    currentPage,
    totalPages,
    itemsPerPage,

    // Setters
    setSearchTerm,
    setSelectedOrders,
    setSelectedOrder,
    setActiveTab,
    setShowVerificationModal,
    setCurrentPage,

    // Functions
    fetchOrders: () => fetchOrders(true), // Expose force refresh version
    handleSendToFirstDelivery,
    handlePrepareForFirstDelivery,
    handleRetryFailedOrder,
    handleRevertOrder,
    handleDeleteOrders,
    handleOrderSelect,
    handleViewOrder,
    handleSendOrder,
  }
} 