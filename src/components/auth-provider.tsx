'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  username: string
  role: string
  lastLogin?: Date
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on mount
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const session = localStorage.getItem('auth_session')
      if (session) {
        const sessionData = JSON.parse(session)
        const now = new Date()
        const sessionExpiry = new Date(sessionData.expiresAt)
        
        if (now < sessionExpiry) {
          setUser(sessionData.user)
      setIsAuthenticated(true)
        } else {
          // Session expired, clear it
          localStorage.removeItem('auth_session')
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      localStorage.removeItem('auth_session')
    } finally {
      setIsLoading(false)
    }
  }

  const createSession = (userData: User) => {
    const session = {
      user: userData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      createdAt: new Date().toISOString()
    }
    localStorage.setItem('auth_session', JSON.stringify(session))
  }

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin'

    if (username === adminUsername && password === adminPassword) {
        const userData: User = {
          id: '1',
          username: username,
          role: 'admin',
          lastLogin: new Date()
        }
        
        setUser(userData)
      setIsAuthenticated(true)
        createSession(userData)
        
        return { success: true }
      }
      
      return { 
        success: false, 
        error: 'Invalid username or password' 
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('auth_session')
  }

  const refreshSession = async () => {
    await checkAuthStatus()
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      refreshSession 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 