'use client'

import { useState, useEffect } from 'react'
import { Order } from '@/lib/supabase'

interface DroppexStatus {
  dev: { connected: boolean; error?: string };
  prod: { connected: boolean; error?: string };
  current: { connected: boolean; error?: string };
}

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
  const [droppexStatus, setDroppexStatus] = useState<DroppexStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [shopifyStatus, setShopifyStatus] = useState<ShopifyStatus>({ connected: false })
  const [activeTab, setActiveTab] = useState('new')
  const [statusFilter, setStatusFilter] = useState('all')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [ordersToSend, setOrdersToSend] = useState<Order[]>([])

  // Initialize data
  useEffect(() => {
    fetchOrders()
    fetchDroppexStatus()
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
          console.log('Shopify Connection Error:', data.error)
        } else if (data.message) {
          setShopifyStatus({ connected: false, message: data.message })
          console.log('Shopify Connection Warning:', data.message)
        } else {
          setShopifyStatus({ connected: true })
          console.log('Orders Loaded Successfully:', `Loaded ${data.orders?.length || 0} orders from Shopify`)
        }
      } else {
        console.log('Failed to Load Orders: Unable to fetch orders from Shopify')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setShopifyStatus({ connected: false, message: 'Failed to connect to Shopify' })
      console.log('Connection Error: Failed to connect to Shopify. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDroppexStatus = async () => {
    try {
      const response = await fetch('/api/droppex-status')
      if (response.ok) {
        const data = await response.json()
        setDroppexStatus(data)
        
        if (data.current?.connected) {
          console.log('Droppex Connected: Successfully connected to Droppex production environment')
        } else if (data.current?.error) {
          console.log('Droppex Connection Failed:', data.current.error)
        }
      } else {
        console.log('Droppex Status Error: Unable to check Droppex connection status')
      }
    } catch (error) {
      console.error('Error fetching Droppex status:', error)
      console.log('Droppex Status Error: Failed to check Droppex connection status')
    } finally {
      setStatusLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      const response = await fetch('/api/test-supabase')
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
        console.log('Database Test Successful: Successfully connected to Supabase database')
      } else {
        console.log('Database Test Failed: Unable to connect to Supabase database')
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      console.log('Database Test Error: Failed to test database connection')
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
          console.log('Orders Sent Successfully:', `Successfully sent ${orderIds.length} order(s) to Droppex`)
        } else {
          console.log('Failed to Send Orders:', data.error || "An error occurred while sending orders to Droppex")
        }
      } else {
        console.log('Failed to Send Orders: Unable to send orders to Droppex. Please try again.')
      }
    } catch (error) {
      console.error('Error sending orders to Droppex:', error)
      console.log('Network Error: Failed to send orders to Droppex. Please check your connection.')
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
      console.log(`Retrying failed order ${orderId}:`, failedOrder)
      setOrdersToSend([failedOrder])
      setShowVerificationModal(true)
    } else {
      console.log(`Order ${orderId} not found or not in failed status`)
      console.log('Order Not Found:', `Order ${orderId} not found or not in failed status`)
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
          console.log('Order Reverted Successfully:', `Order ${order.name} has been reverted to 'Not sent' status`)
        } else {
          console.log('Failed to Revert Order:', data.error || "An error occurred while reverting the order")
        }
      } else {
        console.log('Failed to Revert Order: Unable to revert order. Please try again.')
      }
    } catch (error) {
      console.error('Error reverting order:', error)
      console.log('Network Error: Failed to revert order. Please check your connection.')
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
  const filteredOrders = orders.filter(order =>
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFilteredOrdersByTab = () => {
    switch (activeTab) {
      case 'new':
        return filteredOrders.filter(o => o.parcel_status === 'Not sent')
      case 'sent':
        return filteredOrders.filter(o => o.parcel_status === 'Sent to Droppex')
      case 'failed':
        return filteredOrders.filter(o => o.parcel_status === 'Failed')
      default:
        return filteredOrders
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

  return {
    // State
    orders,
    loading,
    searchTerm,
    selectedOrders,
    selectedOrder,
    sendingOrders,
    droppexStatus,
    statusLoading,
    shopifyStatus,
    activeTab,
    statusFilter,
    debugInfo,
    showVerificationModal,
    ordersToSend,
    tabOrders,
    orderStats,

    // Setters
    setSearchTerm,
    setSelectedOrders,
    setSelectedOrder,
    setActiveTab,
    setStatusFilter,
    setShowVerificationModal,

    // Functions
    fetchOrders,
    fetchDroppexStatus,
    testConnection,
    handleSendToDroppex,
    handlePrepareForDroppex,
    handleRetryFailedOrder,
    handleRevertOrder,
    handleOrderSelect,
    handleViewOrder,
    handleSendOrder,
  }
} 