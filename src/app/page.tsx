'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { ProtectedRoute } from '@/components/protected-route'
import { UserProfile } from '@/components/user-profile'
import { VerificationModal } from '@/components/verification-modal'
import { SearchFilters } from '@/components/dashboard/search-filters'
import { OrderTable } from '@/components/dashboard/order-table'
import { useDashboard } from '@/hooks/use-dashboard'
import { Package, Truck, AlertCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function Dashboard() {
  const { logout } = useAuth()
  const router = useRouter()
  const dashboard = useDashboard()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

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
                <UserProfile />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Search and Filters */}
          <SearchFilters
            searchTerm={dashboard.searchTerm}
            onSearchChange={dashboard.setSearchTerm}
            statusFilter={dashboard.statusFilter}
            onStatusFilterChange={dashboard.setStatusFilter}
            selectedOrdersCount={dashboard.selectedOrders.length}
            onSendSelected={() => dashboard.handlePrepareForDroppex(dashboard.selectedOrders)}
            sendingOrders={dashboard.sendingOrders}
          />

          {/* Orders Table */}
          <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
            <Tabs value={dashboard.activeTab} onValueChange={dashboard.setActiveTab} className="w-full">
              <div className="border-b border-gray-100">
                <div className="px-8 py-6">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-xl">
                    <TabsTrigger 
                      value="new" 
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      <Package className="h-4 w-4" />
                      New Orders ({dashboard.orderStats.notSent})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="sent" 
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      <Truck className="h-4 w-4" />
                      Sent Orders ({dashboard.orderStats.sent})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="failed" 
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Failed Orders ({dashboard.orderStats.failed})
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <TabsContent value="new" className="p-0">
                <OrderTable
                  orders={dashboard.tabOrders}
                  loading={dashboard.loading}
                  selectedOrders={dashboard.selectedOrders}
                  onOrderSelect={dashboard.handleOrderSelect}
                  onViewOrder={dashboard.handleViewOrder}
                  onRetryOrder={dashboard.handleRetryFailedOrder}
                  onRevertOrder={dashboard.handleRevertOrder}
                  onSendOrder={dashboard.handleSendOrder}
                  sendingOrders={dashboard.sendingOrders}
                />
              </TabsContent>
              
              <TabsContent value="sent" className="p-0">
                <OrderTable
                  orders={dashboard.tabOrders}
                  loading={dashboard.loading}
                  selectedOrders={dashboard.selectedOrders}
                  onOrderSelect={dashboard.handleOrderSelect}
                  onViewOrder={dashboard.handleViewOrder}
                  onRetryOrder={dashboard.handleRetryFailedOrder}
                  onRevertOrder={dashboard.handleRevertOrder}
                  onSendOrder={dashboard.handleSendOrder}
                  sendingOrders={dashboard.sendingOrders}
                />
              </TabsContent>
              
              <TabsContent value="failed" className="p-0">
                <OrderTable
                  orders={dashboard.tabOrders}
                  loading={dashboard.loading}
                  selectedOrders={dashboard.selectedOrders}
                  onOrderSelect={dashboard.handleOrderSelect}
                  onViewOrder={dashboard.handleViewOrder}
                  onRetryOrder={dashboard.handleRetryFailedOrder}
                  onRevertOrder={dashboard.handleRevertOrder}
                  onSendOrder={dashboard.handleSendOrder}
                  sendingOrders={dashboard.sendingOrders}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Verification Modal */}
        <VerificationModal
          isOpen={dashboard.showVerificationModal}
          onClose={() => dashboard.setShowVerificationModal(false)}
          orders={dashboard.ordersToSend}
          onSendToDroppex={dashboard.handleSendToDroppex}
          sendingOrders={dashboard.sendingOrders}
        />

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-center items-center">
              <p className="text-sm text-gray-500">
                © 2025{' '}
                <a 
                  href="https://www.deskofmj.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Desk of Mj LTD
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