'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LogOut, User, Calendar } from 'lucide-react'

export function UserProfile() {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-700">{user.username}</span>
      </button>
      
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.username}</p>
              <p className="text-sm text-gray-500">{user.role === 'admin' ? 'Administrator' : 'User'}</p>
            </div>
          </div>
          
          <Separator />
          
          {user.lastLogin && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Login</span>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(user.lastLogin)}</span>
              </div>
            </div>
          )}
          
          <Separator />
          
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="w-full border-gray-300 text-gray-700 hover:bg-black hover:text-white hover:border-black"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
} 