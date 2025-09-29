'use client'

import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/card"
import { Star } from "lucide-react"

const Testimonials = () => {
    return (
            <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
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
    )
}

export default Testimonials