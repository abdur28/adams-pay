"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement forgot password logic
    console.log("Forgot password form submitted for:", email)
    setIsSubmitted(true)
  }

  const handleBackToForm = () => {
    setIsSubmitted(false)
    setEmail("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--adams-navy)]">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Image src="/logo.png" alt="Adams Pay Logo" width={50} height={50} className="w-12 h-12" />
            <h1 className="text-3xl font-bold text-white">Adams Pay</h1>
          </div>
          <p className="text-gray-300 text-sm font-medium">Reset your password securely</p>
        </div>

        {/* Forgot Password Form */}
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-[var(--adams-navy)]">
              {isSubmitted ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSubmitted
                ? `We've sent a password reset link to ${email}`
                : "Enter your email address and we'll send you a link to reset your password"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {isSubmitted ? (
              <div className="space-y-6 text-center">
                {/* Success Icon */}
                <div className="mx-auto w-16 h-16 bg-[var(--adams-light-gray)] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-[var(--adams-green)]" />
                </div>

                {/* Instructions */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    We've sent a secure link to <span className="font-semibold text-[var(--adams-navy)]">{email}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Click the link in the email to reset your password. The link will expire in 15 minutes.
                  </p>
                </div>

                {/* Resend Options */}
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Didn't receive the email? Check your spam folder or</p>
                  <Button
                    variant="ghost"
                    onClick={handleBackToForm}
                    className="text-sm p-0 h-auto font-semibold text-[var(--adams-green)] hover:underline hover:bg-transparent"
                  >
                    try a different email address
                  </Button>
                </div>

                {/* Back to Sign In */}
                <Button asChild variant="outline" className="w-full h-11 bg-white border-gray-300 hover:bg-gray-50 transition-colors">
                  <Link href="/auth/signin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-[var(--adams-green)] focus:ring-2 focus:ring-[var(--adams-green)]/20 transition-all"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[var(--adams-green)] hover:bg-[var(--adams-green)]/90 text-white font-semibold text-base transition-all duration-200"
                >
                  Send Reset Link
                </Button>

                {/* Back to Sign In */}
                <Button asChild variant="ghost" className="w-full text-gray-600 hover:bg-gray-50">
                  <Link href="/auth/signin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          Need help?{" "}
          <Link href="/support" className="text-[var(--adams-green)] hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}