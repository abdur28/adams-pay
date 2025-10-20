"use client"

import { useState, useEffect, use } from "react"
import { notFound, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Clock,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  FileText,
  Download,
  Trash2,
  Building2,
  CreditCard,
  User,
  Mail,
  Phone,
  Info,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
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
import { toast } from "sonner"
import useData from "@/hooks/useData"
import useActions from "@/hooks/useActions"
import { FirebaseTransaction } from "@/types/exchange"
import { formatCurrency } from "@/types/exchange"
import { useAuth } from "@/contexts/AuthContext"

export default function TransactionDetailPage({transactionId}: {transactionId: string}) {
  const router = useRouter()
  const { user } = useAuth()

  const {
    getTransactionById,
    getRateById,
    loading,
    error,
  } = useData()

  const {
    uploadTransferReceipt,
    deleteTransferReceipt,
    cancelTransfer,
    completeTransfer,
    loading: actionLoading,
    uploadProgress,
  } = useActions()

  // State
  const [transaction, setTransaction] = useState<FirebaseTransaction | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [isExpired, setIsExpired] = useState(false)
  const [copiedField, setCopiedField] = useState<string>("")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

  // Load transaction data
  useEffect(() => {
    loadTransaction()
  }, [transactionId])

  // Load payment methods from exchange rate
  useEffect(() => {
    if (transaction?.rateId) {
      loadPaymentMethods()
    }
  }, [transaction?.rateId])

  // Countdown timer
  useEffect(() => {
    if (!transaction?.expiresAt) return

    const updateTimer = () => {
      const now = new Date().getTime()
      
      // Handle both Firestore Timestamp and ISO string
      let expiryTime: number
      if (typeof transaction.expiresAt === 'string') {
        expiryTime = new Date(transaction.expiresAt).getTime()
      } else if (transaction.expiresAt?.toDate) {
        // Firestore Timestamp
        expiryTime = transaction.expiresAt.toDate().getTime()
      } else if (transaction.expiresAt?.seconds) {
        // Firestore Timestamp object
        expiryTime = transaction.expiresAt.seconds * 1000
      } else {
        setTimeRemaining("Invalid date")
        setIsExpired(true)
        return
      }

      const diff = expiryTime - now

      if (diff <= 0) {
        setTimeRemaining("Expired")
        setIsExpired(true)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
      setIsExpired(false)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [transaction?.expiresAt])

  const loadTransaction = async () => {
    const txn = await getTransactionById(transactionId)
    if (txn) {
      setTransaction(txn)
    } else {
      toast.error("Transaction not found")
      router.push("/transfer")
    }
  }

  const loadPaymentMethods = async () => {
    if (!transaction?.rateId) return
    const rate = await getRateById(transaction.rateId)
    if (rate?.paymentMethods) {
      setPaymentMethods(rate.paymentMethods)
      setSelectedPaymentMethod(rate.paymentMethods[0])
    }
  }

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedField(""), 2000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only images (JPEG, PNG, WebP) and PDF files are allowed")
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUploadReceipt = async () => {
    if (!selectedFile || !transaction) return

    setUploadingReceipt(true)
    const result = await uploadTransferReceipt(transaction.id, selectedFile, 'fromReceipt')

    if (result.success) {
      toast.success("Receipt uploaded successfully!")
      setShowUploadDialog(false)
      setSelectedFile(null)
      loadTransaction() // Reload to get updated data
    } else {
      toast.error(result.error || "Failed to upload receipt")
    }
    setUploadingReceipt(false)
  }

  const handleDeleteReceipt = async () => {
    if (!transaction) return

    const result = await deleteTransferReceipt(transaction.id, 'fromReceipt')

    if (result.success) {
      toast.success("Receipt deleted successfully!")
      loadTransaction()
    } else {
      toast.error(result.error || "Failed to delete receipt")
    }
  }

  const handleCancelTransfer = async () => {
    if (!transaction) return

    const result = await cancelTransfer(transaction.id, "Cancelled by user")

    if (result.success) {
      toast.success("Transfer cancelled successfully")
      setShowCancelDialog(false)
      router.push("/transfer")
    } else {
      toast.error(result.error || "Failed to cancel transfer")
    }
  }

  const handleCompleteTransfer = async () => {
    if (!transaction) return

    if (isExpired) return

    const result = await completeTransfer(transaction.id, (transaction.totalfromAmount ? transaction.totalfromAmount > 0 : false))

    if (result.success) {
      toast.success("Transfer completed successfully!")
      setShowCompleteDialog(false)
      loadTransaction() // Reload to get updated status
    } else {
      toast.error(result.error || "Failed to complete transfer")
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20">Pending</Badge>,
      processing: <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20">Processing</Badge>,
      completed: <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/20">Completed</Badge>,
      failed: <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20">Failed</Badge>,
      cancelled: <Badge className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/20">Cancelled</Badge>,
    }
    return badges[status as keyof typeof badges] || null
  }

  if (loading.transactions || !transaction) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a] pt-32">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
              <p className="text-lg font-medium text-white">Loading Transfer Details</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a]">
      <div className="max-w-4xl mx-auto space-y-6 mt-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/transactions")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transfers
          </Button>
        </div>

        {/* Timer Card */}
        {transaction.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`${
              isExpired 
                ? "bg-red-500/10 border-red-500/20" 
                : "bg-gradient-to-r from-[#70b340]/20 to-[#5a9235]/20 border-[#70b340]/30"
            } backdrop-blur-xl p-0`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-xl flex items-center justify-center ${
                      isExpired ? "bg-red-500/20" : "bg-[#70b340]/20"
                    }`}>
                      <Clock className={`h-8 w-8 ${isExpired ? "text-red-400" : "text-[#70b340]"}`} />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Time Remaining</p>
                      <p className={`text-3xl font-bold font-mono ${
                        isExpired ? "text-red-400" : "text-white"
                      }`}>
                        {timeRemaining}
                      </p>
                    </div>
                  </div>
                  {isExpired && (
                    <Alert className="bg-red-500/10 border-red-500/20 max-w-sm">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-white/90">
                        Transfer has expired. Please contact support.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Transaction Details */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Transfer Details</h2>
              {getStatusBadge(transaction.status)}
            </div>

            <Separator className="bg-white/10" />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-white/50 text-sm">You Send</p>
                  <p className="text-white text-2xl font-bold">
                    {transaction.totalfromAmount ? formatCurrency(transaction.totalfromAmount, transaction.fromCurrency) : formatCurrency(transaction.fromAmount, transaction.fromCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Exchange Rate</p>
                  <p className="text-white font-semibold">
                    1 {transaction.fromCurrency} = {transaction.exchangeRate} {transaction.toCurrency}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Transaction ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono text-sm">{transaction.id}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyToClipboard(transaction.id, 'id')}
                      className="h-6 w-6 p-0 text-white hover:bg-white/10"
                    >
                      {copiedField === 'id' ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-white/50 text-sm">Recipient Gets</p>
                  <p className="text-[#70b340] text-2xl font-bold">
                    {formatCurrency(transaction.toAmount, transaction.toCurrency)}
                  </p>
                </div>
                {transaction.discountAmount && transaction.discountAmount > 0 && transaction.totalfromAmount && transaction.totalfromAmount > 0 ? (
                  <div>
                    <p className="text-white/50 text-sm">Discount</p>
                    <span className="text-white font-semibold flex gap-2">
                      <p>{formatCurrency(transaction.totalfromAmount, transaction.fromCurrency)}</p>
                      <p className="text-xs flex items-center">
                        <span className="line-through">{formatCurrency(transaction.fromAmount, transaction.fromCurrency)}</span>
                      </p>
                    </span>
                  </div>
                ) : null}
                <div>
                  <p className="text-white/50 text-sm">Created At</p>
                  <p className="text-white">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        {transaction.status === "pending" && selectedPaymentMethod && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-[#70b340]/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-[#70b340]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Payment Instructions</h2>
                  <p className="text-white/70 text-sm">
                    Transfer to the account below and upload your receipt
                  </p>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Payment Method Selection */}
              {paymentMethods.length > 1 && (
                <div className="space-y-2">
                  <p className="text-white/90 font-semibold text-sm">Select Payment Method</p>
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map((method) => (
                      <Button
                        key={method.id}
                        variant={selectedPaymentMethod?.id === method.id ? "default" : "outline"}
                        onClick={() => setSelectedPaymentMethod(method)}
                        className={
                          selectedPaymentMethod?.id === method.id
                            ? "bg-[#70b340] hover:bg-[#5a9235] text-white"
                            : "border-white/20 text-white bg-transparent hover:bg-white/10"
                        }
                      >
                        {method.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="bg-white/5 rounded-lg p-5 space-y-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-[#70b340]" />
                    <div>
                      <p className="text-white/50 text-xs">Payment Method</p>
                      <p className="text-white font-semibold">{selectedPaymentMethod.name}</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {selectedPaymentMethod.bankName && (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white/50 text-xs">Bank Name</p>
                      <p className="text-white font-semibold">{selectedPaymentMethod.bankName}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyToClipboard(selectedPaymentMethod.bankName, 'bankName')}
                      className="h-8 w-8 p-0 text-white hover:bg-white/10"
                    >
                      {copiedField === 'bankName' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/50 text-xs">Account Number</p>
                    <p className="text-white font-mono font-semibold text-lg">
                      {selectedPaymentMethod.accountNumber}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyToClipboard(selectedPaymentMethod.accountNumber, 'accountNumber')}
                    className="h-8 w-8 p-0 text-white hover:bg-white/10"
                  >
                    {copiedField === 'accountNumber' ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {selectedPaymentMethod.accountName && (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white/50 text-xs">Account Name</p>
                      <p className="text-white font-semibold">{selectedPaymentMethod.accountName}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyToClipboard(selectedPaymentMethod.accountName, 'accountName')}
                      className="h-8 w-8 p-0 text-white hover:bg-white/10"
                    >
                      {copiedField === 'accountName' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}

                {selectedPaymentMethod.instructions && (
                  <>
                    <Separator className="bg-white/10" />
                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <Info className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-white/90 text-sm">
                        {selectedPaymentMethod.instructions}
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </div>

              {/* Amount to Send Highlight */}
              <Alert className="bg-[#70b340]/10 border-[#70b340]/20">
                <AlertTriangle className="h-4 w-4 text-[#70b340]" />
                <AlertDescription className="text-white/90">
                  <span className="font-semibold">Amount to Send: </span>
                  <span className="text-[#70b340] font-bold text-lg">
                    {transaction.totalfromAmount ? formatCurrency(transaction.totalfromAmount, transaction.fromCurrency) : formatCurrency(transaction.fromAmount, transaction.fromCurrency)}
                  </span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Receipt Upload */}
        {transaction.status === "pending" ? (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Payment Receipt</h3>
                    <p className="text-white/70 text-sm">Upload proof of payment</p>
                  </div>
                </div>
              </div>

              {transaction.fromReceipt ? (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle2 className="h-5 w-5 text-green-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-white font-semibold">Receipt Uploaded</p>
                        <p className="text-white/70 text-sm">{transaction.fromReceipt.name}</p>
                        <p className="text-white/50 text-xs">
                          {(transaction.fromReceipt.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(transaction.fromReceipt?.url, '_blank')}
                        className="border-white/20 text-white bg-transparent hover:bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeleteReceipt}
                        disabled={actionLoading.upload}
                        className="border-red-500/20 text-red-400 bg-transparent hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="w-full bg-[#70b340] hover:bg-[#5a9235] text-white h-12"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Receipt
                </Button>
              )}

              <Alert className="bg-white/5 border-white/10">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-white/70 text-xs">
                  Upload your payment receipt or screenshot. Accepted formats: JPG, PNG, WebP, PDF (Max 10MB)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
         <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Payment Receipts</h3>
                  </div>
                </div>
              </div>

              {transaction.fromReceipt && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle2 className="h-5 w-5 text-green-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-white font-semibold">From Receipt</p>
                        <p className="text-white/70 text-sm">{transaction.fromReceipt.name}</p>
                        <p className="text-white/50 text-xs">
                          {(transaction.fromReceipt.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(transaction.fromReceipt?.url, '_blank')}
                        className="border-white/20 text-white bg-transparent hover:bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              )} 

              {transaction.toReceipt && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle2 className="h-5 w-5 text-green-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-white font-semibold">To Receipt</p>
                        <p className="text-white/70 text-sm">{transaction.toReceipt.name}</p>
                        <p className="text-white/50 text-xs">
                          {(transaction.toReceipt.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(transaction.toReceipt?.url, '_blank')}
                        className="border-white/20 text-white bg-transparent hover:bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              )} 
            </CardContent>
          </Card>
        )}



        {/* Recipient Details */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Recipient Information</h3>
                <p className="text-white/70 text-sm">Details of the recipient</p>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-white/50 text-xs">Full Name</p>
                  <p className="text-white font-semibold">{transaction.recipientDetails.fullName}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="text-white">{transaction.recipientDetails.email}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </p>
                  <p className="text-white">{transaction.recipientDetails.phoneNumber}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-white/50 text-xs">Bank Name</p>
                  <p className="text-white font-semibold">{transaction.recipientDetails.bankName}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Account Number</p>
                  <p className="text-white font-mono">{transaction.recipientDetails.accountNumber}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Account Name</p>
                  <p className="text-white">{transaction.recipientDetails.accountName}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {transaction.status === "pending" && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              disabled={actionLoading.transfer}
              className="flex-1 border-white/20 text-white bg-transparent hover:bg-white/10"
            >
              Cancel Transfer
            </Button>
            <Button
              onClick={() => setShowCompleteDialog(true)}
              disabled={actionLoading.transfer || !transaction.fromReceipt}
              className="flex-1 bg-[#70b340] hover:bg-[#5a9235] text-white"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Complete Transfer
            </Button>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Payment Receipt</DialogTitle>
            <DialogDescription className="text-white/70">
              Upload proof of your payment to complete the transfer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
              <input
                type="file"
                id="receipt-upload"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                onChange={handleFileSelect}
              />
              <label htmlFor="receipt-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-white/50" />
                <p className="text-white font-medium mb-1">
                  {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-white/50 text-sm">
                  JPG, PNG, WebP or PDF (max 10MB)
                </p>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-[#70b340]" />
                    <div>
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-white/50 text-sm">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFile(null)}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {uploadingReceipt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Uploading...</span>
                  <span className="text-white font-medium">{uploadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false)
                setSelectedFile(null)
              }}
              disabled={uploadingReceipt}
              className="border-white/20 text-white bg-transparent hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadReceipt}
              disabled={!selectedFile || uploadingReceipt}
              className="bg-[#70b340] hover:bg-[#5a9235] text-white"
            >
              {uploadingReceipt ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Receipt
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-[#1a2951] border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Transfer?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to cancel this transfer? This action cannot be undone.
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

      {/* Complete Transfer Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent className="bg-[#1a2951] border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#70b340]" />
              Complete Transfer?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Have you sent the payment and uploaded your receipt? Once you mark this transfer as complete, it will be processed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white bg-transparent hover:bg-white/10">
              Not yet
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteTransfer}
              disabled={actionLoading.transfer}
              className="bg-[#70b340] hover:bg-[#5a9235]"
            >
              {actionLoading.transfer ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Yes, complete transfer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}