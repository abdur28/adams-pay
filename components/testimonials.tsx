// components/testimonials.tsx
'use client'

import { motion } from "framer-motion"
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials"

const Testimonials = () => {
  const testimonials = [
    {
      quote:
        "Adams Pay has revolutionized how I send money to my suppliers overseas. Fast, reliable, and incredibly affordable. The instant transfers have saved my business countless hours.",
      name: "Sarah Johnson",
      designation: "Small Business Owner, Lagos",
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "I've tried many money transfer services, but Adams Pay is by far the best. The rates are unbeatable and transfers are instant. Customer support is always there when I need them.",
      name: "Michael Chen",
      designation: "Freelance Developer, Singapore",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "Sending money home has never been easier. The app is intuitive and customer support is always helpful. I save money on every transaction compared to traditional banks.",
      name: "Priya Patel",
      designation: "International Student, London",
      src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "As someone who travels frequently for work, Adams Pay has been a lifesaver. I can send money to any country instantly with competitive rates and zero hidden fees.",
      name: "David Martinez",
      designation: "Business Consultant, New York",
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "The security features and transparency of Adams Pay give me peace of mind. Every transaction is tracked and I always know exactly what I'm paying for.",
      name: "Amara Okafor",
      designation: "Healthcare Professional, Toronto",
      src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
  ]

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

        <AnimatedTestimonials testimonials={testimonials} autoplay={true} />
      </div>
    </section>
  )
}

export default Testimonials