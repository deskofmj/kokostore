'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { AuthRedirect } from '@/components/auth-redirect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Lock, User, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading) {
      // This will be handled by the auth provider
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await login(username, password)
      if (result.success) {
        router.push('/')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit(e as React.FormEvent)
    }
  }

  if (isLoading) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <AuthRedirect>
      <div className="min-h-screen flex">
        {/* Left side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-white">
          <div className="w-full max-w-md">
            <Card className="border-0 bg-white">
              <CardHeader className="space-y-1 pb-4 sm:pb-6">
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                  <div>
                    <img src="/logo.svg" alt="Koko Store" className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-center text-slate-900">
                  Welcome to Koko Store
                </CardTitle>
                <CardDescription className="text-center text-xs sm:text-sm text-slate-600">
                  Sign in to your order management system
                </CardDescription>
              </CardHeader>
          
          <CardContent className="space-y-3 sm:space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs sm:text-sm font-medium text-slate-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your username"
                    className="pl-9 sm:pl-10 h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your password"
                    className="pl-9 sm:pl-10 pr-10 h-10 sm:h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>
              </div>



            <Button
              type="submit"
              disabled={isSubmitting || !username || !password}
              className="w-full h-10 sm:h-11 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 sm:space-y-4">
            <Separator />
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Secure authentication powered by Koko Store
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
    
    {/* Right side - Background Image */}
    <div className="hidden lg:flex lg:w-1/2 relative">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/compressed-8F7A9947-Modifier copie.webp')`
        }}
      />
      <div className="absolute inset-0 bg-black/10" />
    </div>
  </div>
  </AuthRedirect>
  )
} 