'use client'

import { useState, useEffect } from 'react'
import { Order } from '@/lib/supabase'

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

  // Initialize data
  useEffect(() => {
    fetchOrders()
  }, [])

  // API Functions
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/shopify-orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        
        if (data.error) {
          setShopifyStatus({ connected: false, message: data.error })
        } else if (data.message) {
          setShopifyStatus({ connected: false, message: data.message })
        } else {
          setShopifyStatus({ connected: true })
        }
      } else {
        setShopifyStatus({ connected: false, message: 'Failed to load orders' })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setShopifyStatus({ connected: false, message: 'Failed to connect to Shopify' })
    } finally {
      setLoading(false)
    }
  }

  // Order Management Functions
  const handleSendToDroppex = async (orderIds: number[]) => {
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
        await fetchOrders() // Refresh orders
        setSelectedOrders([])
        
        if (data.success) {
          // Orders sent successfully
        } else {
          // Handle error silently or show toast
        }
      } else {
        // Handle network error silently or show toast
      }
    } catch (error) {
      console.error('Error sending orders to Droppex:', error)
    } finally {
      setSendingOrders(false)
    }
  }

  const handlePrepareForDroppex = (orderIds: number[]) => {
    const selectedOrders = orders.filter(order => orderIds.includes(order.id))
    setOrdersToSend(selectedOrders)
    setShowVerificationModal(true)
  }

  const handleRetryFailedOrder = (orderId: number) => {
    const failedOrder = orders.find(order => order.id === orderId && order.parcel_status === 'Failed')
    if (failedOrder) {
      setOrdersToSend([failedOrder])
      setShowVerificationModal(true)
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
        await fetchOrders()
        setSelectedOrder(null)
        
        if (data.success) {
          // Order reverted successfully
        } else {
          // Handle error silently or show toast
        }
      } else {
        // Handle network error silently or show toast
      }
    } catch (error) {
      console.error('Error reverting order:', error)
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

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
  }

  const handleSendOrder = (orderId: number) => {
    handlePrepareForDroppex([orderId])
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
        return filtered.filter(o => o.parcel_status === 'Sent to Droppex')
      case 'failed':
        return filtered.filter(o => o.parcel_status === 'Failed')
      default:
        return filtered
    }
  }

  // Statistics
  const orderStats = {
    total: orders.length,
    notSent: orders.filter(o => o.parcel_status === 'Not sent').length,
    sent: orders.filter(o => o.parcel_status === 'Sent to Droppex').length,
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
    fetchOrders,
    handleSendToDroppex,
    handlePrepareForDroppex,
    handleRetryFailedOrder,
    handleRevertOrder,
    handleOrderSelect,
    handleViewOrder,
    handleSendOrder,
  }
} 