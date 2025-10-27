"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowUpDown,
  RefreshCcw,
  Search,
  ChevronRight,
  MoreHorizontal,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Upload,
  Download,
  Trash2,
  MessageSquare,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { FirebaseTransaction } from "@/types/exchange";
import useAdminTransactions from "@/hooks/admin/useAdminTransactions";

type TransactionStatus = FirebaseTransaction['status'];
type TransactionType = FirebaseTransaction['type'];

export default function AdminTransactionsPage() {
  const {
    fetchTransactions,
    rejectTransaction,
    cancelTransaction,
    refundTransaction,
    markTransactionAsComplete,
    addTransactionNote,
    uploadTransactionReceipt,
    deleteTransactionReceipt,
    transactions,
    loading,
    error,
    pagination,
    clearError
  } = useAdminTransactions();

  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [filteredTransactions, setFilteredTransactions] = useState<FirebaseTransaction[]>([]);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Dialogs state
  const [selectedTransaction, setSelectedTransaction] = useState<FirebaseTransaction | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState< 'reject' | 'cancel' | 'refund' | 'complete' | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  
  // Receipt upload state
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [receiptType, setReceiptType] = useState<'fromReceipt' | 'toReceipt'>('fromReceipt');

  // Load transactions when component mounts
  useEffect(() => {
    loadTransactions();
  }, []);

  // Filter transactions based on search, status, and type
  useEffect(() => {
    if (!transactions) return;

    let filtered = [...transactions];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(txn => txn.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(txn => txn.type === typeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(txn => 
        txn.id.toLowerCase().includes(query) ||
        txn.recipientDetails?.fullName?.toLowerCase().includes(query) ||
        txn.recipientDetails?.email?.toLowerCase().includes(query) ||
        txn.recipientDetails?.phoneNumber?.includes(query) ||
        txn.recipientDetails?.accountNumber?.toLowerCase().includes(query) ||
        txn.fromCurrency.toLowerCase().includes(query) ||
        txn.toCurrency.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, statusFilter, typeFilter, searchQuery]);

  const loadTransactions = async () => {
    try {
      await fetchTransactions({filters: [{ field: 'status', operator: '!=', value: 'pending' }], limit: 50 });
    } catch (err) {
      console.error("Error loading transactions:", err);
      toast.error("Failed to load transactions");
    }
  };

  const loadMoreTransactions = async () => {
    if (!pagination.hasMore) return;
    
    try {
      await fetchTransactions({
        limit: 50,
        startAfter: pagination.lastDoc!
      });
    } catch (err) {
      console.error("Error loading more transactions:", err);
      toast.error("Failed to load more transactions");
    }
  };

  const handleRefresh = () => {
    clearError();
    loadTransactions();
  };

  const openActionDialog = (transaction: FirebaseTransaction, action: typeof actionType) => {
    setSelectedTransaction(transaction);
    setActionType(action);
    setActionReason("");
    setActionNotes("");
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedTransaction || !actionType) return;
    
    try {
      setProcessingAction(true);
      
      switch (actionType) {
        case 'reject':
          if (!actionReason) {
            toast.error("Please provide a rejection reason");
            return;
          }
          await rejectTransaction(selectedTransaction.id, actionReason);
          toast.success("Transaction rejected successfully");
          break;
        case 'cancel':
          await cancelTransaction(selectedTransaction.id, actionReason || undefined);
          toast.success("Transaction cancelled successfully");
          break;
        case 'refund':
          await refundTransaction(selectedTransaction.id, actionReason || undefined);
          toast.success("Transaction refunded successfully");
          break;
        case 'complete':
          await markTransactionAsComplete(selectedTransaction.id, actionNotes || undefined);
          toast.success("Transaction marked as complete");
          break;
      }
      
      setActionDialogOpen(false);
      setSelectedTransaction(null);
      setActionType(null);
    } catch (err) {
      console.error("Error performing action:", err);
      toast.error("Failed to perform action");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedTransaction || !newNote.trim()) return;
    
    try {
      setProcessingAction(true);
      await addTransactionNote(selectedTransaction.id, newNote);
      toast.success("Note added successfully");
      setNoteDialogOpen(false);
      setNewNote("");
      // Refresh the transaction details
      const updatedTxn = transactions.find(t => t.id === selectedTransaction.id);
      if (updatedTxn) setSelectedTransaction(updatedTxn);
    } catch (err) {
      console.error("Error adding note:", err);
      toast.error("Failed to add note");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReceiptUpload = async (file: File, type: 'fromReceipt' | 'toReceipt') => {
    if (!selectedTransaction) return;
    
    try {
      setUploadingReceipt(true);
      setReceiptType(type);
      setUploadProgress(0);
      
      await uploadTransactionReceipt(
        selectedTransaction.id,
        file,
        type,
        (progress) => setUploadProgress(progress)
      );
      
      toast.success("Receipt uploaded successfully");
      // Refresh transaction details
      const updatedTxn = transactions.find(t => t.id === selectedTransaction.id);
      if (updatedTxn) setSelectedTransaction(updatedTxn);
    } catch (err) {
      console.error("Error uploading receipt:", err);
      toast.error("Failed to upload receipt");
    } finally {
      setUploadingReceipt(false);
      setUploadProgress(0);
    }
  };

  const handleReceiptDelete = async (type: 'fromReceipt' | 'toReceipt') => {
    if (!selectedTransaction) return;
    
    try {
      await deleteTransactionReceipt(selectedTransaction.id, type);
      toast.success("Receipt deleted successfully");
      // Refresh transaction details
      const updatedTxn = transactions.find(t => t.id === selectedTransaction.id);
      if (updatedTxn) setSelectedTransaction(updatedTxn);
    } catch (err) {
      console.error("Error deleting receipt:", err);
      toast.error("Failed to delete receipt");
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    return type === 'exchange' 
      ? <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Exchange</Badge>
      : <Badge variant="outline" className="bg-cyan-100 text-cyan-800 border-cyan-200">Transfer</Badge>;
  };

  const getDialogContent = () => {
    switch (actionType) {
      case 'reject':
        return {
          title: "Reject Transaction",
          description: `Please provide a reason for rejecting this transaction. The user will be notified.`,
          showNotes: false,
          showReason: true,
          actionText: "Reject",
          actionClass: "bg-red-600 hover:bg-red-700"
        };
      case 'cancel':
        return {
          title: "Cancel Transaction",
          description: `Are you sure you want to cancel this transaction?`,
          showNotes: false,
          showReason: true,
          actionText: "Cancel",
          actionClass: "bg-red-600 hover:bg-red-700"
        };
      case 'refund':
        return {
          title: "Refund Transaction",
          description: `Are you sure you want to refund this transaction? This action will cancel the transaction and mark it as refunded.`,
          showNotes: false,
          showReason: true,
          actionText: "Refund",
          actionClass: "bg-orange-600 hover:bg-orange-700"
        };
      case 'complete':
        return {
          title: "Complete Transaction",
          description: `Mark this transaction as completed. The user will be notified.`,
          showNotes: true,
          showReason: false,
          actionText: "Complete",
          actionClass: "bg-[#70b340] hover:bg-[#5a9235]"
        };
      default:
        return {
          title: "",
          description: "",
          showNotes: false,
          showReason: false,
          actionText: "",
          actionClass: ""
        };
    }
  };

  // Loading state
  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Transaction Management</h1>
            <p className="text-white/70 mt-1">
              Manage all transactions on Adams Pay
            </p>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
            <p className="text-lg font-medium text-white">Loading Transactions</p>
            <p className="text-sm text-white/70 mt-1">
              Please wait while we fetch the transaction data...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dialogContent = getDialogContent();

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Transaction Management</h1>
          <p className="text-white/70 mt-1">
            Manage all transactions on Adams Pay
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={loading} 
          className="bg-[#70b340] hover:bg-[#5a9235] text-white self-start sm:self-auto"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Total</p>
                <p className="text-3xl font-bold text-white mt-1">{transactions.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <ArrowUpDown className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Processing</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {transactions.filter(t => t.status === 'processing').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Completed</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {transactions.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Failed</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {transactions.filter(t => t.status === 'failed' ).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Cancelled</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {transactions.filter(t => t.status === 'cancelled').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="exchange">Exchange</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== "all" || typeFilter !== "all" || searchQuery) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-white hover:bg-white/10"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search by ID, recipient, account, currency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20 p-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="font-medium text-white">Error loading transactions</h3>
                <p className="text-sm text-white/70">{error}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={loading}
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filteredTransactions.length === 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 border-dashed p-0">
          <CardContent className="p-12 text-center">
            <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-white/50" />
            <p className="text-lg font-medium text-white">No transactions found</p>
            <p className="text-sm text-white/70 mt-1">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try changing your search or filter criteria"
                : "No transactions have been created yet"}
            </p>
            {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
              <Button 
                variant="outline" 
                className="mt-4 border-white/20 text-white hover:bg-white/10 bg-transparent"
                onClick={() => {
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions table */}
      {filteredTransactions.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/90">Transaction</TableHead>
                  <TableHead className="text-white/90">Recipient</TableHead>
                  <TableHead className="text-white/90">From</TableHead>
                  <TableHead className="text-white/90">To</TableHead>
                  <TableHead className="text-white/90">Rate</TableHead>
                  <TableHead className="text-white/90">Status</TableHead>
                  <TableHead className="text-white/90">Date</TableHead>
                  <TableHead className="text-right text-white/90">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="font-mono text-sm text-white">
                        {transaction.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-white/50">
                        {transaction.fromCurrency} → {transaction.toCurrency}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        {transaction.recipientDetails?.fullName || 'N/A'}
                      </div>
                      <div className="text-xs text-white/50">
                        {transaction.recipientDetails?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {transaction.totalfromAmount ? transaction.totalfromAmount : transaction.fromAmount} {transaction.fromCurrency}
                          </div>
                          {transaction.totalfromAmount ? <div className="text-xs text-white/50 line-through">
                           {transaction.fromAmount} {transaction.fromCurrency}
                          </div> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {transaction.toAmount} {transaction.toCurrency}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white/80">
                        {transaction.exchangeRate}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Calendar className="h-3 w-3" />
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/10">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a2951] border-white/20 text-white">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setDetailsDialogOpen(true);
                            }}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          
                          {transaction.status === 'processing' && (
                            <DropdownMenuItem 
                              onClick={() => openActionDialog(transaction, 'complete')}
                              className="text-green-400 hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          
                          {(transaction.status === 'pending' || transaction.status === 'processing') && (
                            <DropdownMenuItem 
                              onClick={() => openActionDialog(transaction, 'cancel')}
                              className="text-red-400 hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          
                          {transaction.status === 'completed' && (
                            <DropdownMenuItem 
                              onClick={() => openActionDialog(transaction, 'refund')}
                              className="text-orange-400 hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Refund
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Load more button */}
      {filteredTransactions.length > 0 && pagination.hasMore && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={loadMoreTransactions}
            disabled={loading}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More 
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Action Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent className="bg-[#1a2951] border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {dialogContent.showReason && (
              <div>
                <label className="text-sm text-white/70 mb-2 block">
                  Reason {actionType === 'reject' ? '(Required)' : '(Optional)'}
                </label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  rows={3}
                />
              </div>
            )}
            
            {dialogContent.showNotes && (
              <div>
                <label className="text-sm text-white/70 mb-2 block">
                  Notes (Optional)
                </label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  rows={3}
                />
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={dialogContent.actionClass}
              disabled={processingAction || (dialogContent.showReason && actionType === 'reject' && !actionReason)}
            >
              {processingAction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                dialogContent.actionText
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Transaction Details</DialogTitle>
            <DialogDescription className="text-white/70">
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Status and ID */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Transaction ID</p>
                  <p className="text-lg font-mono text-white">{selectedTransaction.id}</p>
                </div>
                <div className="flex gap-2">
                  {getTypeBadge(selectedTransaction.type)}
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-white/50">From Amount</p>
                  <p className="text-white font-semibold">
                    {selectedTransaction.totalfromAmount ? selectedTransaction.totalfromAmount : selectedTransaction.fromAmount} {selectedTransaction.fromCurrency}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">To Amount</p>
                  <p className="text-white font-semibold">
                    {selectedTransaction.toAmount} {selectedTransaction.toCurrency}
                  </p>
                </div>
                {selectedTransaction.totalfromAmount ? (
                  <>
                  <div className="space-y-1">
                    <p className="text-sm text-white/50">Original Amount</p>
                    <p className="text-white font-semibold">
                      {selectedTransaction.fromAmount} {selectedTransaction.fromCurrency}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-white/50">Discount</p>
                    <p className="text-white font-semibold">
                      {selectedTransaction.discountAmount} {selectedTransaction.fromCurrency}
                    </p>
                  </div>
                  </>
                ) : null}
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Exchange Rate</p>
                  <p className="text-white">{selectedTransaction.exchangeRate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Rate ID</p>
                  <p className="text-white font-mono text-sm">{selectedTransaction.rateId}</p>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#70b340]" />
                  Recipient Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-white/50">Full Name</p>
                    <p className="text-white">{selectedTransaction.recipientDetails?.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-white/50">Email</p>
                    <p className="text-white">{selectedTransaction.recipientDetails?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-white/50">Phone Number</p>
                    <p className="text-white">{selectedTransaction.recipientDetails?.phoneNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-white/50">Bank Name</p>
                    <p className="text-white">{selectedTransaction.recipientDetails?.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-white/50">Account Number</p>
                    <p className="text-white font-mono">{selectedTransaction.recipientDetails?.accountNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-white/50">Account Name</p>
                    <p className="text-white">{selectedTransaction.recipientDetails?.accountName}</p>
                  </div>
                </div>
              </div>

              {/* Receipts Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#70b340]" />
                  Payment Receipts
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-white/50">From Receipt (Sent)</p>
                    {selectedTransaction.fromReceipt ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white bg-transparent hover:bg-white/10"
                          onClick={() => window.open(selectedTransaction.fromReceipt?.url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleReceiptUpload(file, 'fromReceipt');
                          }}
                          disabled={uploadingReceipt}
                          className="bg-white/5 border-white/20 text-white file:text-white"
                        />
                        {uploadingReceipt && receiptType === 'fromReceipt' && (
                          <p className="text-xs text-white/70 mt-1">Uploading: {uploadProgress}%</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-white/50">To Receipt (Received)</p>
                    {selectedTransaction.toReceipt ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white bg-transparent hover:bg-white/10"
                          onClick={() => window.open(selectedTransaction.toReceipt?.url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/20 bg-transparent text-red-400 hover:bg-red-500/10"
                          onClick={() => handleReceiptDelete('toReceipt')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleReceiptUpload(file, 'toReceipt');
                          }}
                          disabled={uploadingReceipt}
                          className="bg-white/5 border-white/20 text-white file:text-white"
                        />
                        {uploadingReceipt && receiptType === 'toReceipt' && (
                          <p className="text-xs text-white/70 mt-1">Uploading: {uploadProgress}%</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Admin Notes</h3>
                  <Button
                    size="sm"
                    onClick={() => setNoteDialogOpen(true)}
                    className="bg-[#70b340] hover:bg-[#5a9235]"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
                {selectedTransaction.adminNotes ? (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans">
                      {selectedTransaction.adminNotes}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-white/50">No notes added yet</p>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-white/50">Created</p>
                  <p className="text-white">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-white/50">Updated</p>
                  <p className="text-white">{new Date(selectedTransaction.updatedAt).toLocaleString()}</p>
                </div>
                {selectedTransaction.completedAt && (
                  <div className="space-y-1">
                    <p className="text-white/50">Completed</p>
                    <p className="text-white">{new Date(selectedTransaction.completedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedTransaction.cancelledAt && (
                  <div className="space-y-1">
                    <p className="text-white/50">Cancelled</p>
                    <p className="text-white">{new Date(selectedTransaction.cancelledAt).toLocaleString()}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-white/50">Expires</p>
                  <p className="text-white">{new Date(selectedTransaction.expiresAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
            <DialogDescription className="text-white/70">
              Add a note to this transaction for internal reference
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note..."
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNoteDialogOpen(false);
                  setNewNote("");
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim() || processingAction}
                className="bg-[#70b340] hover:bg-[#5a9235]"
              >
                {processingAction ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Note'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}