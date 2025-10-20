"use client"

import { Transfer } from "@/components/Transfer"
import { GlobeDemo } from "@/components/globe-demo"
import { BlockScroll } from "@/components/block-scroll"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
} from "lucide-react"
import Footer from "@/components/footer"
import Contact from "@/components/contact"
import CTA from "@/components/CTA-section"
import Testimonials from "@/components/testimonials"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a]">
      {/* Hero Section */}
      <section className="pt-32 px-4 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 z-0"
        />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.div
              className="flex justify-center mb-8"
            >
              <Image
                src="/logo.png"
                alt="Adams Pay Logo"
                width={50}
                height={50}
                className="w-20 h-20"
              />
            </motion.div>
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-white mb-6 text-balance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Send Money <span className="text-[#70b340]">Globally</span> in Minutes
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-white/80 mb-12 max-w-3xl mx-auto text-pretty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Experience the future of digital payments with Adams Pay. Fast, secure, and reliable money transfers
              across the globe.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center mb-10 md:mb-14"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-[#70b340] hover:bg-[#5a9235] text-white px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300 shadow-2xl"
                >
                  Start Transfer <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300 bg-transparent"
                >
                  Learn More
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { value: "$2.5B+", label: "Transferred Globally" },
                { value: "180+", label: "Countries Supported" },
                { value: "5M+", label: "Happy Customers" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.2, duration: 0.6 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                >
                  <motion.div
                    className="text-3xl font-bold text-[#70b340] mb-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-white/70">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Transfer Section */}
      <BlockScroll>
        <div className="px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Try Our <span className="text-[#70b340]">Transfer Calculator</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              See how much you can save with our competitive exchange rates and zero fees
            </p>
          </div>
          <Transfer />
        </div>
      </BlockScroll>

      {/* Globe Section */}
      <section className=" px-4">
        <GlobeDemo />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Choose <span className="text-[#70b340]">Adams Pay</span>?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Experience the difference with our cutting-edge technology and customer-first approach
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Lightning Fast",
                description:
                  "Send money in minutes, not days. Our advanced technology ensures your transfers are processed instantly.",
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Bank-Level Security",
                description:
                  "Your money and data are protected with military-grade encryption and advanced fraud detection.",
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: "Global Reach",
                description:
                  "Send money to over 180 countries with competitive exchange rates and transparent pricing.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.03 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 h-full hover:bg-white/15 hover:border-[#70b340]/40 transition-all duration-300 group">
                  <CardContent className="p-8 text-center">
                    <motion.div
                      className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10l rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 border border-[#70b340]/20 group-hover:border-[#70b340]/60"
                    >
                      <motion.div
                        className="text-[#70b340]"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.4,
                        }}
                      >
                        {feature.icon}
                      </motion.div>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#70b340] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-white/70 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* App CTA Section */}
      {/* <CTA /> */}

      {/* Contact Section */}
      <Contact />

      {/* Footer Section */}
      <Footer />
    </div>
  )
}