'use client'

import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/card"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { CheckCircle, Mail, MapPin, Phone } from "lucide-react"
import useData from "@/hooks/useData"
import { useEffect, useState } from "react"
import useActions from "@/hooks/useActions"
import { toast } from "sonner"

const Contact = () => {
    const { system, fetchSystemData } = useData()
    const { sendContact } = useActions()
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch system data on mount
    useEffect(() => {
        fetchSystemData()
    }, [])

    const handleContactSubmit = async () => {
        setLoading(true)
        const fullName = `${firstName} ${lastName}`
        try {
            await sendContact({name: fullName, email, message})
            toast.success('Message sent successfully')
            setFirstName('')
            setLastName('')
            setEmail('')
            setMessage('')
            setLoading(false)
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to send message')
            setLoading(false)
        }
    }


    return (
      <section className="py-20 px-4" id="contact">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
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
                        onChange={(e) => setFirstName(e.target.value)}
                        value={firstName}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                      <Input
                        placeholder="Last Name"
                        onChange={(e) => setLastName(e.target.value)}
                        value={lastName}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="Email Address"
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Textarea
                      placeholder="Your Message"
                      rows={5}
                      onChange={(e) => setMessage(e.target.value)}
                      value={message}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Button
                      type="button"
                      onClick={handleContactSubmit}
                      disabled={loading}
                      className="w-full bg-[#70b340] hover:bg-[#5a9235] text-white py-6 text-lg rounded-xl font-semibold transition-all duration-300"
                    >
                      {loading ? 'Sending...' : 'Send Message'}
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
                    <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-full w-12 h-12 flex items-center justify-center border border-[#70b340]/20">
                      <Mail className="h-6 w-6 text-[#70b340]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Email</div>
                      <div className="text-white/70">{system?.siteEmail || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-full w-12 h-12 flex items-center justify-center border border-[#70b340]/20">
                      <Phone className="h-6 w-6 text-[#70b340]" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Phone</div>
                      <div className="text-white/70">{system?.sitePhone || "N/A"}</div>
                    </div>
                  </div>
                  
                </div>
              </div>

              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="">
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
    )
}

export default Contact