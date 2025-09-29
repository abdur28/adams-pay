// components/CTA-section.tsx
"use client"

import { Bell, Zap, Shield, Globe, DollarSign } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "./ui/button"

const CTA = () => {
  return (
    <section className="pt-10 pb-20 md:py-24 relative overflow-hidden">

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Content */}
          <div className="lg:w-1/2 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white leading-tight">
                Send Money <span className="text-[#70b340]">Globally</span> from Your Phone
              </h2>
              
              <p className="text-white/80 mb-8 text-lg leading-relaxed">
                Download the Adams Pay mobile app to send money worldwide instantly. Track your transfers in real-time, receive instant notifications, and manage all your transactions from anywhere.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Button
                    size="lg"
                    className="bg-[#70b340] hover:bg-[#70b340]/80 text-white px-6 py-6 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    App Store
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Button
                    size="lg"
                    className="bg-[#70b340] hover:bg-[#70b340]/80 text-white px-6 py-6 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                    </svg>
                    Google Play
                  </Button>
                </motion.div>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2"
                >
                  <div className="rounded-full bg-[#70b340]/20 p-2 border border-[#70b340]/30">
                    <Zap className="h-4 w-4 text-[#70b340]" />
                  </div>
                  <span className="text-white">Instant transfers</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2"
                >
                  <div className="rounded-full bg-[#70b340]/20 p-2 border border-[#70b340]/30">
                    <Bell className="h-4 w-4 text-[#70b340]" />
                  </div>
                  <span className="text-white">Real-time alerts</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2"
                >
                  <div className="rounded-full bg-[#70b340]/20 p-2 border border-[#70b340]/30">
                    <Shield className="h-4 w-4 text-[#70b340]" />
                  </div>
                  <span className="text-white">Secure payments</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2"
                >
                  <div className="rounded-full bg-[#70b340]/20 p-2 border border-[#70b340]/30">
                    <Globe className="h-4 w-4 text-[#70b340]" />
                  </div>
                  <span className="text-white">180+ countries</span>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Phone mockup */}
          <div className="lg:w-1/2 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Decorative elements */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#70b340]/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-5 -right-5 w-40 h-40 bg-[#70b340]/20 rounded-full blur-2xl"></div>

              {/* Phone mockup container */}
              <div className="relative z-10 w-[300px] h-[600px] bg-gradient-to-b from-[#1a2951] to-[#101d42] rounded-[3rem] p-3 shadow-2xl border-4 border-white/10">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-[#0f1a3a] rounded-b-2xl"></div>
                
                {/* Phone screen */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* App UI mockup */}
                  <div className="w-full h-full bg-gradient-to-b from-[#101d42] to-[#1a2951] p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="text-white font-bold text-xl">Adams Pay</div>
                      <div className="w-10 h-10 rounded-full bg-[#70b340]/20 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-[#70b340]" />
                      </div>
                    </div>

                    {/* Balance card */}
                    <div className="bg-gradient-to-br from-[#70b340] to-[#5a9235] rounded-2xl p-6 mb-6 shadow-xl">
                      <div className="text-white/80 text-sm mb-2">Total Balance</div>
                      <div className="text-white text-3xl font-bold mb-4">$12,458.50</div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-white text-xs">Send</div>
                        </div>
                        <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-white text-xs">Receive</div>
                        </div>
                      </div>
                    </div>

                    {/* Recent transactions */}
                    <div className="text-white text-sm font-semibold mb-3">Recent Transfers</div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#70b340]/20 flex items-center justify-center">
                              <DollarSign className="h-5 w-5 text-[#70b340]" />
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">Transfer #{i}</div>
                              <div className="text-white/60 text-xs">2 hours ago</div>
                            </div>
                          </div>
                          <div className="text-[#70b340] font-semibold">+$250</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating UI elements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                viewport={{ once: true }}
                className="absolute -right-8 top-20 bg-white p-3 rounded-xl shadow-xl border border-gray-100"
              >
                <Zap className="h-5 w-5 text-[#70b340]" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                viewport={{ once: true }}
                className="absolute -left-12 top-1/3 bg-white p-3 rounded-xl shadow-xl border border-gray-100"
              >
                <Shield className="h-5 w-5 text-blue-500" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                viewport={{ once: true }}
                className="absolute right-10 bottom-20 bg-white px-3 py-2 rounded-xl shadow-xl border border-gray-100"
              >
                <span className="text-xs font-semibold text-[#70b340]">4.9 ★★★★★</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                viewport={{ once: true }}
                className="absolute left-10 top-20 bg-white p-3 rounded-xl shadow-xl border border-gray-100"
              >
                <Globe className="h-5 w-5 text-purple-500" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                viewport={{ once: true }}
                className="absolute left-20 bottom-32 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-xl border border-gray-100"
              >
                <span className="text-xs font-semibold text-[#101d42]">Send money instantly</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                viewport={{ once: true }}
                className="absolute right-16 top-1/2 bg-[#70b340] px-4 py-2 rounded-xl shadow-xl"
              >
                <span className="text-xs font-semibold text-white">$0 fees</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA