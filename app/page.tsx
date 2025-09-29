"use client"

import { FloatingNavbar } from "@/components/floating-navbar"
import { Transfer } from "@/components/Transfer"
import { GlobeDemo } from "@/components/globe-demo"
import { AdamsLogo } from "@/components/adams-logo"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Star,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Download,
  Smartphone,
} from "lucide-react"
import Footer from "@/components/footer"
import Contact from "@/components/Contact"
import CTA from "@/components/CTA-section"
import Testimonials from "@/components/testimonials"

export default function HomePage() {
  // For demo purposes, let's assume user is not signed in for landing page
  const isSignedIn = false

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a]">
      <FloatingNavbar isSignedIn={isSignedIn} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex justify-center mb-8">
              <AdamsLogo className="w-20 h-20 text-[#70b340]" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 text-balance">
              Send Money <span className="text-[#70b340]">Globally</span> in Minutes
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto text-pretty">
              Experience the future of digital payments with Adams Pay. Fast, secure, and reliable money transfers
              across the globe.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button
                size="lg"
                className="bg-[#70b340] hover:bg-[#5a9235] text-white px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300 shadow-2xl"
              >
                Start Transfer <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300 bg-transparent"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-4xl font-bold text-[#70b340] mb-2">$2.5B+</div>
                <div className="text-white/70">Transferred Globally</div>
              </motion.div>
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-4xl font-bold text-[#70b340] mb-2">180+</div>
                <div className="text-white/70">Countries Supported</div>
              </motion.div>
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-4xl font-bold text-[#70b340] mb-2">5M+</div>
                <div className="text-white/70">Happy Customers</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Transfer Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Try Our <span className="text-[#70b340]">Transfer Calculator</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              See how much you can save with our competitive exchange rates and zero fees
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Transfer />
          </motion.div>
        </div>
      </section>

      {/* Globe Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="text-[#70b340]">Global</span> Network
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Connect with our worldwide network of partners and send money to over 180 countries
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <GlobeDemo />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
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
              >
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 h-full hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border border-[#70b340]/20">
                      <div className="text-[#70b340]">{feature.icon}</div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
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
      <CTA />

      {/* Contact Section */}
      <Contact />

      {/* Footer */}
      <Footer />

    </div>
  )
}
