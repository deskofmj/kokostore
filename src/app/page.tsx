'use client'


import { ProtectedRoute } from '@/components/protected-route'
import { UserProfile } from '@/components/user-profile'
import { VerificationModal } from '@/components/verification-modal'
import { SearchFilters } from '@/components/dashboard/search-filters'
import { OrderTable } from '@/components/dashboard/order-table'
import { useDashboard } from '@/hooks/use-dashboard'
import { useAuth } from '@/components/auth-provider'
import { Package, Truck, AlertCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const dashboard = useDashboard()
  const { logout } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <img src="/logo.svg" alt="Salma Collection" className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-sm"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Total Orders */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.orderStats.total}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Sent Orders */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent Orders</p>
                  <p className="text-2xl font-bold text-green-600">{dashboard.orderStats.sent}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Failed Orders */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed Orders</p>
                  <p className="text-2xl font-bold text-red-600">{dashboard.orderStats.failed}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <SearchFilters
            searchTerm={dashboard.searchTerm}
            onSearchChange={dashboard.setSearchTerm}
            selectedOrdersCount={dashboard.selectedOrders.length}
            onSendSelected={() => dashboard.handlePrepareForDroppex(dashboard.selectedOrders)}
            onDeleteSelected={() => dashboard.handleDeleteOrders(dashboard.selectedOrders)}
            sendingOrders={dashboard.sendingOrders}
          />

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border-0 overflow-hidden">
            <Tabs value={dashboard.activeTab} onValueChange={dashboard.setActiveTab} className="w-full">
              <div className="border-b border-gray-100">
                <div className="px-4 sm:px-8 py-4 sm:py-6">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-xl">
                    <TabsTrigger 
                      value="new" 
                      className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white rounded-lg text-xs sm:text-sm"
                    >
                      <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">New Orders</span>
                      <span className="sm:hidden">New</span>
                      <span className="ml-1">({dashboard.orderStats.notSent})</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="sent" 
                      className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white rounded-lg text-xs sm:text-sm"
                    >
                      <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Sent Orders</span>
                      <span className="sm:hidden">Sent</span>
                      <span className="ml-1">({dashboard.orderStats.sent})</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="failed" 
                      className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white rounded-lg text-xs sm:text-sm"
                    >
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Failed Orders</span>
                      <span className="sm:hidden">Failed</span>
                      <span className="ml-1">({dashboard.orderStats.failed})</span>
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
                  onDeleteOrder={(orderId) => dashboard.handleDeleteOrders([orderId])}
                  sendingOrders={dashboard.sendingOrders}
                  currentPage={dashboard.currentPage}
                  totalPages={dashboard.totalPages}
                  onPageChange={dashboard.setCurrentPage}
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
                  onDeleteOrder={(orderId) => dashboard.handleDeleteOrders([orderId])}
                  sendingOrders={dashboard.sendingOrders}
                  currentPage={dashboard.currentPage}
                  totalPages={dashboard.totalPages}
                  onPageChange={dashboard.setCurrentPage}
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
                  onDeleteOrder={(orderId) => dashboard.handleDeleteOrders([orderId])}
                  sendingOrders={dashboard.sendingOrders}
                  currentPage={dashboard.currentPage}
                  totalPages={dashboard.totalPages}
                  onPageChange={dashboard.setCurrentPage}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              {/* Left side - Brand */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div>
                  <img src="/logo.svg" alt="Salma Collection" className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Salma Collection</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Professional Order Management</p>
                </div>
              </div>
              
              {/* Center - Copyright */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-500">
                  © 2025 Salma Collection. All rights reserved.
                </p>
              </div>
              
              {/* Right side - Links */}
              <div className="flex items-center space-x-4 sm:space-x-6">
                <a 
                  href="https://www.deskofmj.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-gray-500 hover:text-black font-medium transition-colors"
                >
                  Powered by Desk of Mj
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  )
} 