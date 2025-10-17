"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export default function VerifyOTPPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { verifyOTP, sendOTP, register } = useAuth()
  
  const email = searchParams.get('email') || ''
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digits
    if (value.length > 1) return
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    // Clear error when user starts typing
    if (error) setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedText.length === 6) {
      const newOtp = pastedText.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const otpValue = otp.join('')
    
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      // First verify OTP
      const verifyResult = await verifyOTP(email, otpValue)
      
      if (verifyResult.success) {
        // Get registration data from session storage
        const registrationDataString = sessionStorage.getItem('registrationData')
        
        if (registrationDataString) {
          const registrationData = JSON.parse(registrationDataString)
          
          // Now complete registration
          const registerResult = await register(registrationData)
          
          if (registerResult.success) {
            setSuccess(true)
            toast.success("Account created successfully!")
            sessionStorage.removeItem('registrationData')
            
            // Redirect after a short delay
            setTimeout(() => {
              router.push('/')
            }, 2000)
          } else {
            setError(registerResult.error || 'Registration failed')
            toast.error(registerResult.error || 'Registration failed')
          }
        } else {
          setError('Registration data not found. Please try again.')
          toast.error('Registration data not found')
        }
      } else {
        setError(verifyResult.error || 'Invalid verification code')
        toast.error(verifyResult.error || 'Invalid verification code')
      }
      
    } catch (error: any) {
      console.error('OTP verification error:', error)
      const errorMessage = error.message || 'Verification failed. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)
    setError('')
    
    try {
      const result = await sendOTP(email)
      
      if (result.success) {
        toast.success("Verification code sent!")
        // Reset timer and clear OTP
        setTimeLeft(300)
        setCanResend(false)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        toast.error(result.error || 'Failed to resend code')
      }
      
    } catch (error: any) {
      console.error('Resend OTP error:', error)
      toast.error(error.message || 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-adams-navy">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Image src="/logo.png" alt="Adams Pay Logo" width={50} height={50} className="w-12 h-12" />
              <h1 className="text-3xl font-bold text-white">Adams Pay</h1>
            </div>
          </div>

          {/* Success Card */}
          <Card className="border-0 shadow-2xl bg-white">
            <CardContent className="px-6 py-8">
              <div className="space-y-6 text-center">
                {/* Success Icon */}
                <div className="mx-auto w-20 h-20 bg-adams-green/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-adams-green" />
                </div>

                {/* Success Message */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-adams-navy">Verification Successful!</h2>
                  <p className="text-gray-600">Your account has been verified successfully.</p>
                </div>

                {/* Continue Button */}
                <Button 
                  className="w-full h-12 bg-adams-green hover:bg-adams-green/90 text-white font-semibold text-base"
                  onClick={() => router.push('/dashboard')}
                >
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-adams-navy">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Image src="/logo.png" alt="Adams Pay Logo" width={50} height={50} className="w-12 h-12" />
            <h1 className="text-3xl font-bold text-white">Adams Pay</h1>
          </div>
          <p className="text-gray-300 text-sm font-medium">Verify your account</p>
        </div>

        {/* OTP Verification Form */}
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-adams-navy">Enter Verification Code</CardTitle>
            <CardDescription className="text-gray-600">
              We sent a 6-digit code to <span className="font-semibold text-adams-navy">{email || 'your email'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input Fields */}
              <div className="space-y-4">
                <div className="flex justify-center gap-3">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className={`w-12 h-14 text-center text-lg font-bold border-gray-300 focus:border-adams-green focus:ring-2 focus:ring-adams-green/20 transition-all ${
                        error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                      }`}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                
                {/* Timer */}
                <div className="text-center">
                  {timeLeft > 0 ? (
                    <p className="text-sm text-gray-500">
                      Code expires in <span className="font-semibold text-adams-navy">{formatTime(timeLeft)}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-500">Verification code has expired</p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full h-12 bg-adams-green hover:bg-adams-green/90 disabled:bg-adams-green/50 text-white font-semibold text-base transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>

              {/* Resend Code */}
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">Didn't receive the code?</p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOTP}
                  disabled={!canResend || isResending}
                  className="text-adams-green hover:bg-adams-green/10 disabled:text-gray-400"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>

              {/* Back Button */}
              <Button asChild variant="ghost" className="w-full text-gray-600 hover:bg-gray-50">
                <Link href="/register">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Registration
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help */}
        <div className="text-center text-xs text-gray-400">
          Having trouble?{" "}
          <Link href="/contact" className="text-adams-green hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}