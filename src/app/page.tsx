'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { ProtectedRoute } from '@/components/protected-route'
import { UserProfile } from '@/components/user-profile'
import { VerificationModal } from '@/components/verification-modal'
import { Order } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { LogOut, Search, Send, RefreshCw, Eye, Wifi, WifiOff, Package, Truck, AlertCircle, ExternalLink, XCircle, User, Clock, CheckCircle, Info, RotateCcw, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const { logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sendingOrders, setSendingOrders] = useState(false)
  const [droppexStatus, setDroppexStatus] = useState<{
    dev: { connected: boolean; error?: string };
    prod: { connected: boolean; error?: string };
    current: { connected: boolean; error?: string };
  } | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [shopifyStatus, setShopifyStatus] = useState<{ connected: boolean; message?: string }>({ connected: false })
  const [activeTab, setActiveTab] = useState('new')
  const [statusFilter, setStatusFilter] = useState('all')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [ordersToSend, setOrdersToSend] = useState<Order[]>([])

  useEffect(() => {
    fetchOrders()
    fetchDroppexStatus()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/shopify-orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        
        // Update Shopify status
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
        
        // Show status based on current environment
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

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

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

  const filteredOrders = orders.filter(order =>
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: Order['parcel_status']) => {
    const variants = {
      'Not sent': 'secondary',
      'Sent to Droppex': 'default',
      'Failed': 'destructive',
    } as const

    return <Badge variant={variants[status]}>{status}</Badge>
  }

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    notSent: orders.filter(o => o.parcel_status === 'Not sent').length,
    sent: orders.filter(o => o.parcel_status === 'Sent to Droppex').length,
    failed: orders.filter(o => o.parcel_status === 'Failed').length,
  }

  // Filter orders based on active tab
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

  const tabOrders = getFilteredOrdersByTab()

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                <h1 className="text-xl font-semibold text-gray-900">Order Fulfillment</h1>
                <p className="text-sm text-gray-500">Shopify • Droppex</p>
                </div>
              </div>
            
            <div className="flex items-center space-x-3">
              {/* API Status Indicators */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">DEV:</span>
                  {statusLoading ? (
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  ) : droppexStatus?.dev.connected ? (
                    <div title="Dev API Connected">
                      <Wifi className="w-4 h-4 text-green-500" />
                    </div>
                  ) : (
                    <div title={`Dev API Disconnected: ${droppexStatus?.dev.error}`}>
                      <WifiOff className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">PROD:</span>
                  {statusLoading ? (
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  ) : droppexStatus?.prod.connected ? (
                    <div title="Prod API Connected">
                      <Wifi className="w-4 h-4 text-green-500" />
                    </div>
                  ) : (
                    <div title={`Prod API Disconnected: ${droppexStatus?.prod.error}`}>
                      <WifiOff className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">SHOPIFY:</span>
                  {shopifyStatus.connected ? (
                    <div title="Shopify Connected">
                      <Wifi className="w-4 h-4 text-green-500" />
                    </div>
                  ) : (
                    <div title={`Shopify Disconnected: ${shopifyStatus.message}`}>
                      <WifiOff className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={() => { fetchOrders(); fetchDroppexStatus(); }} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button 
                onClick={testConnection}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Test DB
              </Button>
              
              <Button 
                onClick={() => {
                  console.log('Toast Test: This is a test success toast notification!')
                }}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Test Toast
              </Button>
              

              
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border-0 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by order number, customer name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              {selectedOrders.length > 0 && (
                <Button
                  onClick={() => handlePrepareForDroppex(selectedOrders)}
                  disabled={sendingOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 px-6"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send {selectedOrders.length} to Droppex
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-100">
              <div className="px-8 py-6">
                <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-xl">
                  <TabsTrigger value="new" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                    <Package className="h-4 w-4" />
                    New Orders ({orderStats.notSent})
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                    <Truck className="h-4 w-4" />
                    Sent Orders ({orderStats.sent})
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    Failed Orders ({orderStats.failed})
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <TabsContent value="new" className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading orders...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 border-b border-gray-100">
                        <TableHead className="w-12 px-6 py-4">
                          <Checkbox 
                            checked={tabOrders.length > 0 && selectedOrders.length === tabOrders.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOrders(tabOrders.map(o => o.id))
                              } else {
                                setSelectedOrders([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 px-6 py-4">Order</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-6 py-4">Customer</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-6 py-4">Contact</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-6 py-4">Total</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-6 py-4">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-6 py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50/50 transition-all duration-200 border-b border-gray-100">
                          <TableCell className="px-6 py-4">
                            <Checkbox 
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedOrders([...selectedOrders, order.id])
                                } else {
                                  setSelectedOrders(selectedOrders.filter(id => id !== order.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 px-6 py-4">{order.name}</TableCell>
                          <TableCell className="text-gray-700 px-6 py-4">
                            {order.shipping_address?.name || order.customer?.first_name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-700 px-6 py-4">
                            <div className="text-sm">
                              <div>{order.shipping_address?.phone || 'N/A'}</div>
                              <div className="text-gray-500">{order.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900 px-6 py-4">${order.total_price}</TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge className="bg-blue-100 text-blue-800">New</Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                className="flex items-center gap-1 border-gray-200 hover:border-gray-300"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              <Button 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                onClick={() => handlePrepareForDroppex([order.id])}
                                disabled={sendingOrders}
                              >
                                Droppex
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sent" className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 border-b border-gray-100">
                      <TableHead className="w-12 px-6 py-4">
                        <Checkbox 
                          checked={tabOrders.length > 0 && selectedOrders.length === tabOrders.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOrders(tabOrders.map(o => o.id))
                            } else {
                              setSelectedOrders([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Order</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Customer</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Contact</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Total</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50/50 transition-all duration-200 border-b border-gray-100">
                        <TableCell className="px-6 py-4">
                          <Checkbox 
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOrders([...selectedOrders, order.id])
                              } else {
                                setSelectedOrders(selectedOrders.filter(id => id !== order.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 px-6 py-4">{order.name}</TableCell>
                        <TableCell className="text-gray-700 px-6 py-4">
                          {order.shipping_address?.name || order.customer?.first_name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-700 px-6 py-4">
                          <div className="text-sm">
                            <div>{order.shipping_address?.phone || 'N/A'}</div>
                            <div className="text-gray-500">{order.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 px-6 py-4">${order.total_price}</TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className="bg-green-100 text-green-800">Sent to Droppex</Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              className="flex items-center gap-1 border-gray-200 hover:border-gray-300"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-orange-200 text-orange-700 hover:bg-orange-50"
                              onClick={() => handleRevertOrder(order)}
                              disabled={sendingOrders}
                            >
                              Revert
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={async () => {
                                try {
                                  const trackingNumber = order.droppex_response?.tracking_number || order.droppex_response?.code_barre
                                  if (!trackingNumber) {
                                    alert('No tracking number found for this order')
                                    return
                                  }
                                  
                                  const response = await fetch('/api/verify-droppex-order', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ trackingNumber })
                                  })
                                  const result = await response.json()
                                  console.log('Verification result:', result)
                                  alert(`Order verification: ${result.exists ? 'EXISTS in Droppex' : 'NOT FOUND in Droppex'}`)
                                } catch (error) {
                                  console.error('Verification failed:', error)
                                  alert('Failed to verify order in Droppex')
                                }
                              }}
                              title="Verify if this order actually exists in Droppex"
                            >
                              Verify
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="failed" className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 border-b border-gray-100">
                      <TableHead className="w-12 px-6 py-4">
                        <Checkbox 
                          checked={tabOrders.length > 0 && selectedOrders.length === tabOrders.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOrders(tabOrders.map(o => o.id))
                            } else {
                              setSelectedOrders([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Order</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Customer</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Contact</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Total</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 px-6 py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50/50 transition-all duration-200 border-b border-gray-100">
                        <TableCell className="px-6 py-4">
                          <Checkbox 
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOrders([...selectedOrders, order.id])
                              } else {
                                setSelectedOrders(selectedOrders.filter(id => id !== order.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 px-6 py-4">{order.name}</TableCell>
                        <TableCell className="text-gray-700 px-6 py-4">
                          {order.shipping_address?.name || order.customer?.first_name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-700 px-6 py-4">
                          <div className="text-sm">
                            <div>{order.shipping_address?.phone || 'N/A'}</div>
                            <div className="text-gray-500">{order.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 px-6 py-4">${order.total_price}</TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className="bg-red-100 text-red-800">Failed</Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              className="flex items-center gap-1 border-gray-200 hover:border-gray-300"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button 
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                              onClick={() => handleRetryFailedOrder(order.id)}
                              disabled={sendingOrders}
                              title="Retry sending this failed order to Droppex"
                            >
                              {sendingOrders ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Retrying...
                                </>
                              ) : (
                                'Retry'
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found.</p>
          </div>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg border-0 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Connection Debug</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Order Preview Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header (Gradient Background) */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedOrder.name}</h2>
                    <p className="text-blue-100 text-sm">
                      Order #{selectedOrder.id} • {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                  className="text-white hover:bg-white/20"
                >
                  <XCircle className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="p-6">
                {/* Order Status & Summary Cards (3-column grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* Parcel Status Card */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Parcel Status</p>
                        <p className="text-lg font-bold text-gray-900">{getStatusBadge(selectedOrder.parcel_status)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Status Card */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600">Payment</p>
                        <p className="text-lg font-bold text-gray-900">{selectedOrder.financial_status || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Price Card */}
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">Total</p>
                        <p className="text-lg font-bold text-gray-900">${selectedOrder.total_price}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Items Section */}
                {selectedOrder.line_items && selectedOrder.line_items.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Package className="h-5 w-5 mr-2 text-blue-600" />
                      Order Items ({selectedOrder.line_items.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.line_items.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                              <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{item.name || item.title}</h4>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                {item.price && (
                                  <p className="text-sm font-medium text-gray-900">{item.price}</p>
                                )}
                                {item.sku && (
                                  <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                )}
                              </div>
                              {item.variant_title && (
                                <p className="text-xs text-blue-600 mt-1">{item.variant_title}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">#{item.id}</p>
                              {item.product_id && (
                                <p className="text-xs text-gray-500">PID: {item.product_id}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer & Shipping Information (2-column grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Customer Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="text-gray-900 font-medium">
                          {selectedOrder.shipping_address?.name || 
                           `${selectedOrder.customer?.first_name || ''} ${selectedOrder.customer?.last_name || ''}`.trim() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-gray-900">{selectedOrder.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-gray-900">
                          {selectedOrder.shipping_address?.phone || selectedOrder.customer?.phone || 'N/A'}
                        </p>
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
                        <p className="text-gray-900">{selectedOrder.shipping_address?.address1 || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">City & Province</p>
                        <p className="text-gray-900">
                          {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.province}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Postal Code</p>
                        <p className="text-gray-900">{selectedOrder.shipping_address?.zip || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Country</p>
                        <p className="text-gray-900">{selectedOrder.shipping_address?.country || 'Tunisia'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Notes Section (Conditional) */}
                {selectedOrder.note && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                      Order Notes
                    </h3>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <p className="text-gray-800">{selectedOrder.note}</p>
                    </div>
                  </div>
                )}

                {/* Order Timeline Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-purple-600" />
                    Order Timeline
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">Order Created</p>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedOrder.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {selectedOrder.parcel_status && selectedOrder.parcel_status !== 'Not sent' && (
                        <div className="flex items-center space-x-4">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="font-medium text-gray-900">Sent to Droppex</p>
                            <p className="text-sm text-gray-600">{selectedOrder.parcel_status}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="bg-gray-50 p-6 rounded-b-2xl border-t">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handlePrepareForDroppex([selectedOrder.id])}
                  disabled={sendingOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-12 font-semibold"
                >
                  {sendingOrders ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending to Droppex...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Send to Droppex
                    </div>
                  )}
                </Button>
                
                {selectedOrder.parcel_status?.toLowerCase().includes('sent') && selectedOrder.parcel_status !== 'Not sent' && (
                  <Button
                    onClick={() => handleRevertOrder(selectedOrder)}
                    disabled={sendingOrders}
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 h-12 font-semibold"
                  >
                    {sendingOrders ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                        Reverting...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Revert to Not Sent
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        orders={ordersToSend}
        onSendToDroppex={handleSendToDroppex}
        sendingOrders={sendingOrders}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-center items-center">
            <p className="text-gray-600 text-sm">
              © 2025{' '}
              <a 
                href="https://www.deskofmj.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                Desk of MJ
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              . All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </ProtectedRoute>
  )
} 