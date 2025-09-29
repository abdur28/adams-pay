"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ArrowRightLeft, Clock, Users, Gift, Settings, LogOut, LogIn } from "lucide-react"
import Image from "next/image"

interface NavItem {
  name: string
  link: string
  icon: React.ReactNode
}

interface FloatingNavbarProps {
  isSignedIn?: boolean
  className?: string
}

export function FloatingNavbar({ isSignedIn = false, className }: FloatingNavbarProps) {
  const [visible, setVisible] = useState(true)

  const signedInNavItems: NavItem[] = [
    {
      name: "Transfer",
      link: "/",
      icon: <ArrowRightLeft className="h-4 w-4" />,
    },
    {
      name: "Transactions",
      link: "/transactions",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      name: "Recipients",
      link: "/recipients",
      icon: <Users className="h-4 w-4" />,
    },
    {
      name: "Referrals",
      link: "/referrals",
      icon: <Gift className="h-4 w-4" />,
    },
    {
      name: "Settings",
      link: "/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ]

  const signedOutNavItems: NavItem[] = []

  const navItems = isSignedIn ? signedInNavItems : signedOutNavItems

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex w-[calc(100%-2rem)] lg:w-5xl  fixed top-6 inset-x-0 mx-auto border border-white/10 rounded-full bg-white/10 backdrop-blur-md shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] pr-3 pl-4 py-3 items-center justify-between space-x-6",
          className,
        )}
      >
        {/* Logo */}
        <a href="/" className="flex items-center space-x-2">
          <Image src="/logo.png" alt="logo" width={40} height={40} className="w-8 h-8" />
          <span className="hidden sm:block text-base font-semibold text-white">Adams Pay</span>
        </a>

        <div className="flex items-center space-x-6">
        {/* Navigation Items */}
        {navItems.map((navItem, idx) => (
          <a
            key={`link=${idx}`}
            href={navItem.link}
            className={cn(
              "relative text-white/80 items-center flex space-x-1 hover:text-white transition-colors duration-200",
            )}
          >
            <span className="block md:hidden">{navItem.icon}</span>
            <span className="hidden md:block text-sm font-medium">{navItem.name}</span>
          </a>
        ))}
        </div>

        {/* Auth Button */}
        {isSignedIn ? (
          <button className="border text-sm font-medium relative border-white/20 text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-200 flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:block">Logout</span>
            <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-[#70b340] to-transparent h-px" />
          </button>
        ) : (
          <a
            href="/auth/signin"
            className="border text-sm font-medium relative border-white/20 text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-200 flex items-center space-x-2"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
            <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-[#70b340] to-transparent h-px" />
          </a>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
