"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const Loading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8 flex items-center justify-center"
        >
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="w-32 h-32 rounded-full border-4 border-transparent border-t-[#70b340] border-r-[#70b340]" />
          </motion.div>

          {/* Middle rotating ring */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: -360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="w-24 h-24 rounded-full border-4 border-transparent border-b-[#5a9235] border-l-[#5a9235]" />
          </motion.div>

          {/* Logo */}
          <motion.div
            className="absolute z-10 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/logo.png"
              alt="Adams Pay Logo"
              width={60}
              height={60}
              className="w-14 h-14 m-auto"
            />
          </motion.div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-3 relative mt-24">
            Loading<motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >...</motion.span>
          </h2>
          <p className="text-white/60">Please wait while we prepare your experience</p>
        </motion.div>
      </div>
    </div>
  )
}

export default Loading