"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <Image
            src="/logo.png"
            alt="Adams Pay Logo"
            width={60}
            height={60}
            className="w-16 h-16 md:w-20 md:h-20"
          />
        </motion.div>



        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-8"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#70b340] to-[#5a9235] leading-none"
            animate={{ 
              textShadow: [
                "0 0 20px rgba(112, 179, 64, 0.3)",
                "0 0 40px rgba(112, 179, 64, 0.5)",
                "0 0 20px rgba(112, 179, 64, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            404
          </motion.h1>
        </motion.div>


        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-md mx-auto">
            Oops! The page you're looking for seems to have gone on a transfer of its own. 
            Let's get you back on track.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/">
              <Button
                size="lg"
                className="bg-[#70b340] hover:bg-[#5a9235] text-white px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300 shadow-2xl"
              >
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Button>
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300 bg-transparent"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </motion.div>
        </motion.div>

        {/* Search Suggestion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <p className="text-white/50 text-sm flex items-center justify-center gap-2">
            <Search className="h-4 w-4" />
            Try searching from the homepage
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFound