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
              What Our <span className="text-[#70b340]">Customers</span> Say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Small Business Owner",
                content:
                  "Adams Pay has revolutionized how I send money to my suppliers overseas. Fast, reliable, and incredibly affordable.",
                rating: 5,
              },
              {
                name: "Michael Chen",
                role: "Freelancer",
                content:
                  "I've tried many money transfer services, but Adams Pay is by far the best. The rates are unbeatable and transfers are instant.",
                rating: 5,
              },
              {
                name: "Priya Patel",
                role: "International Student",
                content:
                  "Sending money home has never been easier. The app is intuitive and customer support is always helpful.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 h-full">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-[#70b340] fill-current" />
                      ))}
                    </div>
                    <p className="text-white/80 mb-6 leading-relaxed">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-white/60 text-sm">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-[#70b340]/20 to-[#70b340]/10 backdrop-blur-xl border-[#70b340]/30 overflow-hidden">
              <CardContent className="p-12 text-center">
                <div className="flex justify-center mb-8">
                  <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-3xl w-24 h-24 flex items-center justify-center border border-[#70b340]/20">
                    <Smartphone className="h-12 w-12 text-[#70b340]" />
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Get the <span className="text-[#70b340]">Adams Pay</span> App
                </h2>
                <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                  Download our mobile app for the fastest and most convenient way to send money worldwide
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-[#70b340] hover:bg-[#5a9235] text-white px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download for iOS
                  </Button>
                  <Button
                    size="lg"
                    className="bg-[#70b340] hover:bg-[#5a9235] text-white px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download for Android
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
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
              Get in <span className="text-[#70b340]">Touch</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out to our friendly support team.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 h-full">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-8">Send us a message</h3>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        placeholder="First Name"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                      <Input
                        placeholder="Last Name"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="Email Address"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Textarea
                      placeholder="Your Message"
                      rows={5}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#70b340] hover:bg-[#5a9235] text-white py-6 text-lg rounded-xl font-semibold transition-all duration-300"
                    >
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-bold text-white mb-8">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-2xl w-12 h-12 flex items-center justify-center border border-[#70b340]/20">
                      <Mail className="h-6 w-6 text-[#70b340]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Email</div>
                      <div className="text-white/70">support@adamspay.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-2xl w-12 h-12 flex items-center justify-center border border-[#70b340]/20">
                      <Phone className="h-6 w-6 text-[#70b340]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Phone</div>
                      <div className="text-white/70">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-2xl w-12 h-12 flex items-center justify-center border border-[#70b340]/20">
                      <MapPin className="h-6 w-6 text-[#70b340]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Address</div>
                      <div className="text-white/70">
                        123 Financial District
                        <br />
                        New York, NY 10004
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">24/7 Support</h4>
                  <p className="text-white/70 mb-4">
                    Our customer support team is available around the clock to assist you with any questions or
                    concerns.
                  </p>
                  <div className="flex items-center gap-2 text-[#70b340]">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Always here to help</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <AdamsLogo className="w-8 h-8 text-[#70b340]" />
                <span className="text-xl font-bold text-white">Adams Pay</span>
              </div>
              <p className="text-white/70 mb-6">
                Fast, secure, and reliable money transfers across the globe. Experience the future of digital payments.
              </p>
              <div className="text-white/60 text-sm">© 2025 Adams Pay. All rights reserved.</div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Money Transfer
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Currency Exchange
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Business Solutions
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    API Integration
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Partners
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#70b340] transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-white/60 text-sm">Licensed and regulated by financial authorities worldwide</div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[#70b340]">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Secure & Encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-[#70b340]">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Fully Licensed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
