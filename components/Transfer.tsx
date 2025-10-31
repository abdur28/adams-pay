"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  ArrowUpDown, 
  Clock, 
  Shield, 
  Zap, 
  Plus, 
  User, 
  AlertTriangle, 
  Loader2,
  CheckCircle2,
  Gift,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import useData from "@/hooks/useData"
import useActions from "@/hooks/useActions"
import { calculateExchange, formatCurrency, CURRENCIES } from "@/types/exchange"
import { SavedRecipient } from "@/types/type"
import { useAuth } from "@/contexts/AuthContext"

export function Transfer() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Data hooks
  const {
    exchangeRates,
    transactions,
    recipients,
    fetchExchangeRates,
    fetchTransactions,
    fetchRecipients,
    loading,
    error,
  } = useData()

  const {
    createTransfer,
    cancelTransfer,
    loading: actionLoading,
    error: actionError,
  } = useActions()

  // Form state
  const [sendAmount, setSendAmount] = useState("1")
  const [selectedRateId, setSelectedRateId] = useState<string>("")
  const [isSwapping, setIsSwapping] = useState(false)

  // Dialog states
  const [showRecipientDialog, setShowRecipientDialog] = useState(false)
  const [showActiveTransferDialog, setShowActiveTransferDialog] = useState(false)
  const [showCancelConfirmDialog, setShowCancelConfirmDialog] = useState(false)
  const [activeTransfer, setActiveTransfer] = useState<any>(null)

  // Recipient form state
  const [recipientMode, setRecipientMode] = useState<"saved" | "new">("saved")
  const [selectedRecipientId, setSelectedRecipientId] = useState("")
  const [useAdamPoints, setUseAdamPoints] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [totalFromAmount, setTotalFromAmount] = useState(0)
  const [totalToAmount, setTotalToAmount] = useState(0)
  const [newRecipient, setNewRecipient] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  })

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      fetchTransactions(user.id, { status: "pending" }, 5)
      fetchRecipients(user.id)
    }
  }, [user?.id])

  useEffect(() => {
    fetchExchangeRates()
  }, [])

  // Set default rate when rates are loaded
  useEffect(() => {
    if (exchangeRates.length > 0 && !selectedRateId) {
      setSelectedRateId(exchangeRates[0].id)
    }
  }, [exchangeRates])

  // Get selected rate
  const selectedRate = useMemo(() => {
    return exchangeRates.find(rate => rate.id === selectedRateId)
  }, [exchangeRates, selectedRateId])

  // Calculate receive amount
  const receiveAmount = useMemo(() => {
    if (!selectedRate || !sendAmount) return "0.00"
    const { toAmount } = calculateExchange(parseFloat(sendAmount), selectedRate.rate)
    return toAmount.toFixed(2)
  }, [sendAmount, selectedRate])

  // Get available "from" currencies
  const availableFromCurrencies = useMemo(() => {
    const uniqueCurrencies = new Set(exchangeRates.map(rate => rate.fromCurrency))
    return Array.from(uniqueCurrencies).map(code => {
      const currency = CURRENCIES.find(c => c.code === code)
      return { code, name: currency?.name || code, symbol: currency?.symbol || code }
    })
  }, [exchangeRates])

  // Get available "to" currencies based on selected "from" currency
  const availableToCurrencies = useMemo(() => {
    if (!selectedRate) return []
    const rates = exchangeRates.filter(rate => rate.fromCurrency === selectedRate.fromCurrency)
    const uniqueCurrencies = new Set(rates.map(rate => rate.toCurrency))
    return Array.from(uniqueCurrencies).map(code => {
      const currency = CURRENCIES.find(c => c.code === code)
      return { code, name: currency?.name || code, symbol: currency?.symbol || code }
    })
  }, [exchangeRates, selectedRate])

  // Handle currency change
  const handleFromCurrencyChange = (fromCurrency: string) => {
    const rate = exchangeRates.find(r => r.fromCurrency === fromCurrency)
    if (rate) {
      setSelectedRateId(rate.id)
    }
  }

  const handleToCurrencyChange = (toCurrency: string) => {
    if (!selectedRate) return
    const rate = exchangeRates.find(
      r => r.fromCurrency === selectedRate.fromCurrency && r.toCurrency === toCurrency
    )
    if (rate) {
      setSelectedRateId(rate.id)
    }
  }

  // Swap currencies
  const swapCurrencies = () => {
    if (!selectedRate) return
    
    setIsSwapping(true)
    
    const swappedRate = exchangeRates.find(
      r => r.fromCurrency === selectedRate.toCurrency && r.toCurrency === selectedRate.fromCurrency
    )
    
    if (swappedRate) {
      setSelectedRateId(swappedRate.id)
      setSendAmount(receiveAmount)
    } else {
      toast.error("Cannot swap - This currency pair is not available in reverse.")
    }
    
    setTimeout(() => setIsSwapping(false), 300)
  }

  // Check for active pending transfer
  const checkActiveTransfer = () => {
    const pending = transactions.find(tx => tx.status === "pending")
    if (pending) {
      setActiveTransfer(pending)
      setShowActiveTransferDialog(true)
      return true
    }
    return false
  }

  // Calculate time remaining for active transfer
  const getTimeRemaining = (expiresAt: any) => {
    let expiryTime: number
    if (typeof expiresAt === 'string') {
      expiryTime = new Date(expiresAt).getTime()
    } else if (expiresAt?.toDate) {
      // Firestore Timestamp
      expiryTime = expiresAt.toDate().getTime()
    } else if (expiresAt?.seconds) {
      // Firestore Timestamp object
      expiryTime = expiresAt.seconds * 1000
    } else {
      toast.error("Invalid date")
      return
    }
    const now = new Date().getTime()
    const expiry = expiryTime
    const diff = expiry - now
    
    if (diff <= 0) return "Expired"
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  // UPDATED: Handle use Adam Points - ONLY for RUB to NGN transfers
  const handleUseAdamsPoints = () => {
    if (!user) {
      router.push("/sign-in")
      return
    }

    if (user.adamPoints < 1) {
      toast.error("You don't have enough Adam Points to use")
      setUseAdamPoints(false)
      return
    }

    if (!selectedRate) {
      toast.error("Please select a valid currency pair")
      setUseAdamPoints(false)
      return
    }

    // RESTRICTION: Only allow RUB to NGN transfers
    if (selectedRate.fromCurrency !== 'RUB' || selectedRate.toCurrency !== 'NGN') {
      toast.error("Adam Points can only be used for RUB to NGN transfers")
      setUseAdamPoints(false)
      setDiscountAmount(0)
      setTotalFromAmount(parseFloat(sendAmount))
      setTotalToAmount(parseFloat(receiveAmount))
      return
    }

    const toAmount = parseFloat(receiveAmount);
    const bonus = user.adamPoints;
    
    setDiscountAmount(bonus);
    setTotalFromAmount(parseFloat(sendAmount));
    setTotalToAmount(toAmount + bonus);
    toast.success(`You'll receive extra ${bonus} NGN bonus (${bonus} Adam Points)`);
  }

  const handleCancelTransfer = async () => {
    if (!activeTransfer) return
    
    const result = await cancelTransfer(activeTransfer.id, "User cancelled to start new transfer")
    
    if (result.success) {
      toast.success("Transfer cancelled successfully")
      setShowCancelConfirmDialog(false)
      setShowActiveTransferDialog(false)
      setActiveTransfer(null)
      fetchTransactions(user!.id, { status: "pending" }, 5)
    } else {
      toast.error(result.error || "Failed to cancel transfer")
    }
  }

  // Handle start transfer button
  const handleStartTransfer = () => {
    if (!user) {
      router.push("/sign-in")
      return
    }

    if (!selectedRate) {
      toast.error("Please select a valid currency pair")
      return
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    const amount = parseFloat(sendAmount)
    if (amount < selectedRate.minAmount) {
      toast.error(`Minimum amount is ${selectedRate.minAmount} ${selectedRate.fromCurrency}`)
      return
    }

    if (amount > selectedRate.maxAmount) {
      toast.error(`Maximum amount is ${selectedRate.maxAmount} ${selectedRate.fromCurrency}`)
      return
    }

    if (checkActiveTransfer()) {
      return
    }

    setShowRecipientDialog(true)
  }

  // Handle submit transfer
  const handleSubmitTransfer = async () => {
    if (!user || !selectedRate) return

    let recipientDetails
    if (recipientMode === "saved") {
      const recipient = recipients.find(r => r.id === selectedRecipientId)
      if (!recipient) {
        toast.error("Please select a recipient")
        return
      }
      recipientDetails = {
        fullName: recipient.fullName,
        email: recipient.email,
        phoneNumber: recipient.phoneNumber,
        bankName: recipient.bankName,
        accountNumber: recipient.accountNumber,
        accountName: recipient.accountName,
      }
    } else {
      if (!newRecipient.fullName || !newRecipient.email || !newRecipient.phoneNumber ||
          !newRecipient.bankName || !newRecipient.accountNumber || !newRecipient.accountName) {
        toast.error("Please fill in all recipient details")
        return
      }
      recipientDetails = newRecipient
    }

    const result = await createTransfer({
      fromAmount: parseFloat(sendAmount),
      discountAmount: discountAmount,
      totalFromAmount: totalFromAmount || parseFloat(sendAmount),
      totalToAmount: totalToAmount || parseFloat(receiveAmount),
      toAmount: parseFloat(receiveAmount),
      fromCurrency: selectedRate.fromCurrency,
      toCurrency: selectedRate.toCurrency,
      exchangeRate: selectedRate.rate,
      rateId: selectedRate.id,
      recipientDetails,
      expiryMinutes: 30,
    }, user.id)

    if (result.success) {
      toast.success("Transfer created successfully!")
      setShowRecipientDialog(false)
      router.push(`/transaction/${result.data.transactionId}`)
    } else {
      toast.error(result.error || "Failed to create transfer")
    }
  }

  // Check if Adam Points can be used (RUB to NGN only)
  const canUseAdamPoints = selectedRate?.fromCurrency === 'RUB' && selectedRate?.toCurrency === 'NGN'

  if (loading.rates) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <Skeleton className="h-20 w-full mb-4 bg-white/10" />
            <Skeleton className="h-20 w-full mb-4 bg-white/10" />
            <Skeleton className="h-20 w-full bg-white/10" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error.rates) {
    return (
      <div className="max-w-lg mx-auto">
        <Alert className="bg-red-500/10 border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-white">{error.rates}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (exchangeRates.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <Alert className="bg-white/10 border-white/20">
          <AlertDescription className="text-white">No exchange rates available at the moment.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto"
      >
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 space-y-6">
              {/* You Send Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white/90 font-semibold text-sm uppercase tracking-wide">
                    You Send
                  </label>
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
                        min={selectedRate?.minAmount}
                        max={selectedRate?.maxAmount}
                      />
                    </div>
                    <Select 
                      value={selectedRate?.fromCurrency} 
                      onValueChange={handleFromCurrencyChange}
                    >
                      <SelectTrigger className="w-auto bg-white/20 border-white/30 text-white h-12 px-4 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                        {availableFromCurrencies.map((currency) => (
                          <SelectItem
                            key={currency.code}
                            value={currency.code}
                            className="text-white hover:bg-white/10 focus:bg-white/10 rounded-lg"
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{currency.code}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedRate && (
                  <p className="text-white/60 text-xs">
                    Min: {selectedRate.minAmount} - Max: {selectedRate.maxAmount} {selectedRate.fromCurrency}
                  </p>
                )}
              </div>

              {/* Swap Button */}
              <div className="flex justify-center relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative">
                  <Button
                    onClick={swapCurrencies}
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-gradient-to-r from-[#70b340] to-[#5a9235] hover:from-[#5a9235] hover:to-[#4a7d2a] text-white w-14 h-14 shadow-xl"
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

              {/* Recipient Gets Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white/90 font-semibold text-sm uppercase tracking-wide">
                    Recipient Gets
                  </label>
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
                    <Select 
                      value={selectedRate?.toCurrency} 
                      onValueChange={handleToCurrencyChange}
                    >
                      <SelectTrigger className="w-auto bg-white/20 border-white/30 text-white h-12 px-4 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                        {availableToCurrencies.map((currency) => (
                          <SelectItem
                            key={currency.code}
                            value={currency.code}
                            className="text-white hover:bg-white/10 focus:bg-white/10 rounded-lg"
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{currency.code}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Rate Info */}
              {selectedRate && (
                <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-2xl p-5 space-y-3 border border-white/10">
                  <div className="flex justify-between items-center text-white/90">
                    <span className="text-sm">Exchange rate</span>
                    <span className="font-bold text-[#70b340]">
                      1 {selectedRate.fromCurrency} = {selectedRate.rate.toLocaleString()} {selectedRate.toCurrency}
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
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3 border border-[#70b340]/20">
                    <Zap className="h-6 w-6 text-[#70b340]" />
                  </div>
                  <p className="text-white/80 text-xs font-medium">Lightning Fast</p>
                </motion.div>
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3 border border-[#70b340]/20">
                    <Shield className="h-6 w-6 text-[#70b340]" />
                  </div>
                  <p className="text-white/80 text-xs font-medium">Bank-Level Security</p>
                </motion.div>
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-gradient-to-br from-[#70b340]/30 to-[#70b340]/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3 border border-[#70b340]/20">
                    <Clock className="h-6 w-6 text-[#70b340]" />
                  </div>
                  <p className="text-white/80 text-xs font-medium">24/7 Support</p>
                </motion.div>
              </div>

              {/* Start Transfer Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleStartTransfer}
                  className="w-full bg-gradient-to-r from-[#70b340] to-[#5a9235] hover:from-[#5a9235] hover:to-[#4a7d2a] text-white font-bold py-6 text-lg rounded-2xl shadow-2xl transition-all duration-300 border border-[#70b340]/30"
                  size="lg"
                  disabled={!selectedRate || actionLoading.transfer}
                >
                  {actionLoading.transfer ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Start My Transfer"
                  )}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Transfer Dialog */}
      <Dialog open={showActiveTransferDialog} onOpenChange={setShowActiveTransferDialog}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Active Transfer Found
            </DialogTitle>
            <DialogDescription className="text-white/70">
              You have an active pending transfer. Please complete or cancel it before starting a new one.
            </DialogDescription>
          </DialogHeader>
          
          {activeTransfer && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Amount:</span>
                  <span className="font-semibold text-white">
                    {activeTransfer.fromAmount} {activeTransfer.fromCurrency}
                  </span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Recipient Gets:</span>
                  <span className="font-semibold text-white">
                    {activeTransfer.toAmount} {activeTransfer.toCurrency}
                  </span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Status:</span>
                  <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20">
                    {activeTransfer.status}
                  </Badge>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Time Remaining:</span>
                  <span className="font-semibold text-amber-400">
                    {getTimeRemaining(activeTransfer.expiresAt)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirmDialog(true)}
              disabled={actionLoading.transfer}
              className="border-white/20 text-white bg-transparent hover:bg-white/10"
            >
              Cancel Transfer
            </Button>
            <Button
              onClick={() => router.push(`/transactions/${activeTransfer?.id}`)}
              className="bg-[#70b340] hover:bg-[#5a9235] text-white"
            >
              Go to Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelConfirmDialog} onOpenChange={setShowCancelConfirmDialog}>
        <AlertDialogContent className="bg-[#1a2951] border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This will cancel your current transfer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white bg-transparent hover:bg-white/10">
              No, keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTransfer}
              disabled={actionLoading.transfer}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading.transfer ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, cancel transfer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recipient Dialog */}
      <Dialog open={showRecipientDialog} onOpenChange={setShowRecipientDialog}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white sm:max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Recipient Details</DialogTitle>
            <DialogDescription className="text-white/70">
              Select a saved recipient or enter new recipient details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Recipient Mode Selection */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <RadioGroup value={recipientMode} onValueChange={(value: any) => setRecipientMode(value)}>
                <div className="flex items-center space-x-3 mb-3">
                  <RadioGroupItem value="saved" id="saved" className="border-white/30 text-[#70b340]" />
                  <Label htmlFor="saved" className="text-white/90 cursor-pointer flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Saved Recipient
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="new" id="new" className="border-white/30 text-[#70b340]" />
                  <Label htmlFor="new" className="text-white/90 cursor-pointer flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Recipient
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Saved Recipients */}
            {recipientMode === "saved" && (
              <div className="space-y-3">
                {loading.recipients ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full bg-white/10" />
                    <Skeleton className="h-20 w-full bg-white/10" />
                  </div>
                ) : recipients.length === 0 ? (
                  <Alert className="bg-white/5 border-white/10">
                    <User className="h-4 w-4 text-white/70" />
                    <AlertDescription className="text-white/70">
                      No saved recipients. Switch to "New Recipient" to add one.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <RadioGroup value={selectedRecipientId} onValueChange={setSelectedRecipientId}>
                    <div className="space-y-2">
                      {recipients.map((recipient) => (
                        <div key={recipient.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem 
                              value={recipient.id} 
                              id={recipient.id} 
                              className="mt-1 border-white/30 text-[#70b340]" 
                            />
                            <Label htmlFor={recipient.id} className="flex-1 cursor-pointer">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white">{recipient.fullName}</p>
                                  {recipient.isDefault && (
                                    <Badge className="bg-[#70b340]/20 text-[#70b340] hover:bg-[#70b340]/20 text-xs">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-white/50">Email</p>
                                    <p className="text-white/90">{recipient.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-white/50">Phone</p>
                                    <p className="text-white/90">{recipient.phoneNumber}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-white/50">Bank Details</p>
                                    <p className="text-white/90">
                                      {recipient.bankName} - {recipient.accountNumber}
                                    </p>
                                    <p className="text-white/70 text-xs">{recipient.accountName}</p>
                                  </div>
                                </div>
                              </div>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </div>
            )}

            {/* New Recipient Form */}
            {recipientMode === "new" && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white/90">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={newRecipient.fullName}
                        onChange={(e) => setNewRecipient({ ...newRecipient, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/90">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newRecipient.email}
                        onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                        placeholder="john@example.com"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-white/90">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={newRecipient.phoneNumber}
                      onChange={(e) => setNewRecipient({ ...newRecipient, phoneNumber: e.target.value })}
                      placeholder="+1234567890"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Bank Information
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="bankName" className="text-white/90">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={newRecipient.bankName}
                      onChange={(e) => setNewRecipient({ ...newRecipient, bankName: e.target.value })}
                      placeholder="Bank of America"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber" className="text-white/90">Account Number *</Label>
                      <Input
                        id="accountNumber"
                        value={newRecipient.accountNumber}
                        onChange={(e) => setNewRecipient({ ...newRecipient, accountNumber: e.target.value })}
                        placeholder="1234567890"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountName" className="text-white/90">Account Name *</Label>
                      <Input
                        id="accountName"
                        value={newRecipient.accountName}
                        onChange={(e) => setNewRecipient({ ...newRecipient, accountName: e.target.value })}
                        placeholder="John Doe"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Additional Options */}
            <div className="space-y-4">
              {/* Adam Points Toggle - ONLY for RUB to NGN */}
              {canUseAdamPoints && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-[#70b340]/20 rounded-lg flex items-center justify-center">
                        <Gift className="h-5 w-5 text-[#70b340]" />
                      </div>
                      <div>
                        <Label htmlFor="adamPoints" className="text-white/90 font-semibold">Use Adam Points</Label>
                        <p className="text-sm text-white/60">
                          Available: {user?.adamPoints || 0}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="adamPoints"
                      checked={useAdamPoints}
                      onCheckedChange={(checked) => {
                        setUseAdamPoints(checked);
                        if (checked) {
                          handleUseAdamsPoints();
                        } else {
                          setDiscountAmount(0);
                          setTotalFromAmount(parseFloat(sendAmount));
                          setTotalToAmount(parseFloat(receiveAmount));
                        }
                      }}
                      disabled={!user?.adamPoints || user.adamPoints === 0}
                      className="data-[state=checked]:bg-[#70b340]"
                    />
                  </div>
                </div>
              )}
            </div>

            {actionError.transfer && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-white">{actionError.transfer}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRecipientDialog(false)}
              disabled={actionLoading.transfer}
              className="border-white/20 text-white bg-transparent hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTransfer}
              disabled={actionLoading.transfer}
              className="bg-[#70b340] hover:bg-[#5a9235] text-white"
            >
              {actionLoading.transfer ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Transfer...
                </>
              ) : (
                "Create Transfer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}