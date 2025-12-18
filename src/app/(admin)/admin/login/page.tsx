'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useHttp } from '@/hooks/useHttp'
import LoginHeader from '../../../../components/admin/auth/LoginHeader'
import LoginForm from '../../../../components/admin/auth/LoginForm'
import LoginFooter from '../../../../components/admin/auth/LoginFooter'
import DemoCredentials from '../../../../components/admin/auth/DemoCredentials'

export default function AdminLoginPage() {
  const router = useRouter()
  const { isLoading, sendHttpRequest: loginReq, error } = useHttp()

  const loginReqSuccessResHandler = () => {
    // Authentication is handled via httpOnly cookies set by the server
    // No need to manually store tokens - the server sets 'admin_auth_token' cookie
    // which is automatically sent with subsequent requests
    // This is the production-ready, secure approach (prevents XSS attacks)
    
    // Redirect to admin dashboard
    router.push('/admin')
  }

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    loginReq({
      successRes: loginReqSuccessResHandler,
      requestConfig: {
        url: '/admin/login', // useHttp hook automatically prefixes with /api/v1
        method: 'POST',
        body: {
          email,
          password,
          rememberMe, // Send rememberMe to server to adjust cookie expiration
        },
        successMessage: 'Logged in successfully',
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 via-white to-apple-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-xl border border-apple-gray-200 overflow-hidden"
        >
          <LoginHeader />
          <LoginForm 
            onSubmit={handleLogin} 
            isLoading={isLoading} 
            error={error || ''}
            onErrorClear={() => {
              // Error clearing is handled by the useHttp hook
            }}
          />
          <LoginFooter />
        </motion.div>

        <DemoCredentials />
      </div>
    </div>
  )
}
