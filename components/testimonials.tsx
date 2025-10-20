// components/testimonials.tsx
'use client'

import { useEffect } from "react"
import { motion } from "framer-motion"
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials"
import useData from "@/hooks/useData"
import { Loader2 } from "lucide-react"

const Testimonials = () => {
  const { testimonials, loading, fetchTestimonials } = useData()

  // Fetch testimonials on mount
  useEffect(() => {
    fetchTestimonials()
  }, [])


  if (testimonials.length <= 0) return null

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            What Our <span className="text-[#70b340]">Customers</span> Say
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Adams Pay for their international money transfers
          </p>
        </motion.div>

        {/* Loading State */}
        {loading.testimonials && testimonials.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
              <p className="text-white/70">Loading testimonials...</p>
            </div>
          </div>
        ) : (
          <AnimatedTestimonials testimonials={testimonials} autoplay={true} />
        )}
      </div>
    </section>
  )
}

export default Testimonials