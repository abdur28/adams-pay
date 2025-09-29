"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Download, Smartphone } from "lucide-react"

const CTA = () => {
    return(
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
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
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
    )
}

export default CTA