"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpDown, Clock, Shield, Zap, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

const currencies = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "RUB", name: "Russian Ruble", flag: "🇷🇺" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
]

export function Transfer() {
  const [sendAmount, setSendAmount] = useState("1")
  const [sendCurrency, setSendCurrency] = useState("USD")
  const [receiveCurrency, setReceiveCurrency] = useState("NGN")
  const [exchangeRate] = useState(1650.5) // Mock exchange rate
  const [isSwapping, setIsSwapping] = useState(false)

  const receiveAmount = (Number.parseFloat(sendAmount) * exchangeRate).toFixed(2)

  const swapCurrencies = () => {
    setIsSwapping(true)

    // Swap currencies
    const tempCurrency = sendCurrency
    setSendCurrency(receiveCurrency)
    setReceiveCurrency(tempCurrency)

    // Swap amounts - set send amount to current receive amount and recalculate
    const currentReceiveAmount = receiveAmount
    setSendAmount(currentReceiveAmount)

    // Reset animation after completion
    setTimeout(() => setIsSwapping(false), 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto"
    >
      <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden">
        <CardContent className="p-0">

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-white/90 font-semibold text-sm uppercase tracking-wide">You Send</label>
                <div className="flex items-center gap-1 text-white/60 text-xs">
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 p-4 hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="bg-transparent border-none text-white md:text-2xl text-lg font-bold h-auto p-0 focus-visible:ring-0 placeholder:text-white/40"
                      placeholder="0.00"
                    />
                  </div>
                  <Select value={sendCurrency} onValueChange={setSendCurrency}>
                    <SelectTrigger className="w-auto bg-white/20 border-white/30 text-white h-12 px-4 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#101d42]/95 backdrop-blur-xl border-white/20 rounded-xl">
                      {currencies.map((currency) => (
                        <SelectItem
                          key={currency.code}
                          value={currency.code}
                          className="text-white hover:bg-white/10 rounded-lg"
                        >
                          <span className="flex items-center gap-2">
                            <span>{currency.flag}</span>
                            <span className="font-medium">{currency.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-center relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative">
                <Button
                  onClick={swapCurrencies}
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-[#70b340] to-[#5a9235] hover:from-[#5a9235] hover:to-[#4a7d2a] text-white w-14 h-14 shadow-xl "
                >
                  <motion.div
                    animate={{ rotate: isSwapping ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <ArrowUpDown className="h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-white/90 font-semibold text-sm uppercase tracking-wide">Recipient Gets</label>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 p-4 hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={receiveAmount}
                      readOnly
                      className="bg-transparent border-none text-white md:text-2xl text-lg font-bold h-auto p-0 focus-visible:ring-0"
                    />
                  </div>
                  <Select value={receiveCurrency} onValueChange={setReceiveCurrency}>
                    <SelectTrigger className="w-auto bg-white/20 border-white/30 text-white h-12 px-4 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#101d42]/95 backdrop-blur-xl border-white/20 rounded-xl">
                      {currencies.map((currency) => (
                        <SelectItem
                          key={currency.code}
                          value={currency.code}
                          className="text-white hover:bg-white/10 rounded-lg"
                        >
                          <span className="flex items-center gap-2">
                            <span>{currency.flag}</span>
                            <span className="font-medium">{currency.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-2xl p-5 space-y-3 border border-white/10">
              <div className="flex justify-between items-center text-white/90">
                <span className="text-sm">Exchange rate</span>
                <span className="font-bold text-[#70b340]">
                  1 {sendCurrency} = {exchangeRate.toLocaleString()} {receiveCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/90">
                <span className="text-sm">Transfer fee</span>
                <span className="font-bold text-[#70b340]">FREE</span>
              </div>
              <div className="flex justify-between items-center text-white/90">
                <span className="text-sm">Delivery time</span>
                <span className="font-bold flex items-center gap-1">
                  <Clock className="h-4 w-4 text-[#70b340]" />
                  10 minutes
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-3 border border-[#70b340]/20">
                  <Zap className="h-6 w-6 text-[#70b340]" />
                </div>
                <p className="text-white/80 text-xs font-medium">Lightning Fast</p>
              </motion.div>
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-3 border border-[#70b340]/20">
                  <Shield className="h-6 w-6 text-[#70b340]" />
                </div>
                <p className="text-white/80 text-xs font-medium">Bank-Level Security</p>
              </motion.div>
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-3 border border-[#70b340]/20">
                  <Clock className="h-6 w-6 text-[#70b340]" />
                </div>
                <p className="text-white/80 text-xs font-medium">24/7 Support</p>
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full bg-gradient-to-r from-[#70b340] to-[#5a9235] hover:from-[#5a9235] hover:to-[#4a7d2a] text-white font-bold py-6 text-lg rounded-2xl shadow-2xl transition-all duration-300 border border-[#70b340]/30"
                size="lg"
              >
                Start My Transfer
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
