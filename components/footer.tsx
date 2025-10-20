// components/footer.tsx
"use client"

import { CheckCircle, Shield, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowRight } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { motion } from "framer-motion"
import Image from "next/image"
import useData from "@/hooks/useData"
import { useEffect, useState } from "react"
import useActions from "@/hooks/useActions"
import { toast } from "sonner"

const Footer = () => {
  const { system, fetchSystemData } = useData()
  const { sendNewsLetter } = useActions()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch system data on mount
  useEffect(() => {
      fetchSystemData()
  }, [])

  const handleNewsletterSubmit = async () => {
    setLoading(true)
    try {
      await sendNewsLetter(email)
      toast.success('Newsletter sent successfully')
      setEmail('')
      setLoading(false)
    } catch (error) {
      console.error('Error sending newsletter:', error)
      toast.error('Failed to send newsletter')
      setLoading(false)
    }
  }


  return (
    <footer className="relative overflow-hidden ">
      {/* Newsletter Section */}
      <div className=" border-y border-white/10 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Stay Updated with <span className="text-[#70b340]">Adams Pay</span>
              </h3>
              <p className="text-white/70">
                Get the latest news, updates, and exclusive offers delivered to your inbox
              </p>
            </div>
            <div className="w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-3 w-full md:min-w-[400px]">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white rounded-full placeholder:text-white/50 focus:border-[#70b340] h-12"
                />
                <Button onClick={handleNewsletterSubmit} disabled={loading} type="button" className="bg-[#70b340] rounded-full hover:bg-[#5a9235] text-white h-12 px-6 whitespace-nowrap">
                  {loading ? 'Sending...' : 'Subscribe'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-16 px-4 bg-gradient-to-b from-transparent to-[#0a1128]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Image
                    src="/logo.png"
                    alt="Adams Pay Logo"
                    width={50}
                    height={50}
                    className="w-12 h-12"
                  />
                </motion.div>
                <span className="text-2xl font-bold text-white">Adams Pay</span>
              </div>
              <p className="text-white/70 mb-6 leading-relaxed">
                Fast, secure, and reliable money transfers across the globe. Experience the future of digital payments with competitive rates and instant transfers.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white/70 hover:text-[#70b340] transition-colors">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-white/70 hover:text-[#70b340] transition-colors">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">support@adamspay.com</span>
                </div>
                <div className="flex items-center gap-3 text-white/70 hover:text-[#70b340] transition-colors">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">123 Financial District, NY 10004</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                  <motion.a
                    href={system?.socialLinks?.facebook || ""}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 hover:bg-[#70b340] p-2.5 rounded-full transition-colors border border-white/10 hover:border-[#70b340]"
                  >
                    <Facebook className="h-4 w-4 text-white" />
                  </motion.a>
                  <motion.a
                    href={system?.socialLinks?.twitter || ""}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 hover:bg-[#70b340] p-2.5 rounded-full transition-colors border border-white/10 hover:border-[#70b340]"
                  >
                    <Twitter className="h-4 w-4 text-white" />
                  </motion.a>
                  <motion.a
                    href={system?.socialLinks?.instagram || ""}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 hover:bg-[#70b340] p-2.5 rounded-full transition-colors border border-white/10 hover:border-[#70b340]"
                  >
                    <Instagram className="h-4 w-4 text-white" />
                  </motion.a>
                  <motion.a
                    href={system?.socialLinks?.linkedin || ""}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/10 hover:bg-[#70b340] p-2.5 rounded-full transition-colors border border-white/10 hover:border-[#70b340]"
                  >
                    <Linkedin className="h-4 w-4 text-white" />
                  </motion.a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Services</h4>
              <ul className="space-y-3">
                {[
                  "Money Transfer",
                  "Currency Exchange",
                  "Business Solutions",
                  "API Integration",
                  "Bulk Payments",
                  "Mobile App",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a href="#" className="text-white/70 hover:text-[#70b340] transition-colors text-sm flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#70b340] rounded-full"></span>
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Company</h4>
              <ul className="space-y-3">
                {[
                  "About Us",
                  "Careers",
                  "Press & Media",
                  "Partners",
                  "Blog",
                  "Events",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a href="#" className="text-white/70 hover:text-[#70b340] transition-colors text-sm flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#70b340] rounded-full"></span>
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Support</h4>
              <ul className="space-y-3">
                {[
                  "Help Center",
                  "Contact Us",
                  "FAQs",
                  "Privacy Policy",
                  "Terms of Service",
                  "Cookie Policy",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a href="#" className="text-white/70 hover:text-[#70b340] transition-colors text-sm flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#70b340] rounded-full"></span>
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-white/60 text-sm text-center md:text-left">
                © 2025 Adams Pay. All rights reserved.
              </div>
              <div className="flex items-center gap-4 text-white/60 text-sm">
                <a href="#" className="hover:text-[#70b340] transition-colors">
                  Privacy
                </a>
                <span>•</span>
                <a href="#" className="hover:text-[#70b340] transition-colors">
                  Terms
                </a>
                <span>•</span>
                <a href="#" className="hover:text-[#70b340] transition-colors">
                  Sitemap
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#70b340]/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#70b340]/5 rounded-full blur-3xl -z-10"></div>
    </footer>
  )
}

export default Footer