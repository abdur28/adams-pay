"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCcw,
  ArrowUpDown,
  ChevronRight,
  Eye,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Filter,
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import useData from "@/hooks/useData";
import { FirebaseTransaction } from "@/types/exchange";
import { formatCurrency } from "@/types/exchange";

type TransactionStatus = FirebaseTransaction['status'];
type TransactionType = FirebaseTransaction['type'];

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    fetchTransactions,
    fetchUserTransactionStats,
    transactions,
    transactionsPagination,
    loading,
    error,
    clearTransactionsError,
    resetTransactions,
  } = useData();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [filteredTransactions, setFilteredTransactions] = useState<FirebaseTransaction[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  // Load transactions on mount
  useEffect(() => {
    if (user?.id) {
      loadTransactions();
      loadStats();
    }
  }, [user?.id]);

  // Filter transactions
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
        txn.fromCurrency.toLowerCase().includes(query) ||
        txn.toCurrency.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, statusFilter, typeFilter, searchQuery]);

  const loadTransactions = async () => {
    if (!user?.id) return;
    
    try {
      resetTransactions();
      await fetchTransactions(user.id, undefined, 20);
    } catch (err) {
      console.error("Error loading transactions:", err);
      toast.error("Failed to load transactions");
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;
    
    try {
      const userStats = await fetchUserTransactionStats(user.id);
      setStats(userStats);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadMoreTransactions = async () => {
    if (!user?.id || !transactionsPagination.hasMore) return;
    
    try {
      await fetchTransactions(
        user.id,
        undefined,
        20,
        transactionsPagination.lastDoc!
      );
    } catch (err) {
      console.error("Error loading more transactions:", err);
      toast.error("Failed to load more transactions");
    }
  };

  const handleRefresh = () => {
    clearTransactionsError();
    loadTransactions();
    loadStats();
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
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    return type === 'exchange'
      ? <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Exchange</Badge>
      : <Badge variant="outline" className="bg-cyan-100 text-cyan-800 border-cyan-200">Transfer</Badge>;
  };

  // Loading state
  if (loading.transactions && transactions.length === 0) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a] pt-32">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
              <p className="text-lg font-medium text-white">Loading Transactions</p>
              <p className="text-sm text-white/70 mt-1">
                Please wait while we fetch your transaction history...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a]">
      <div className="max-w-7xl mx-auto space-y-6 mt-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Transactions</h1>
            <p className="text-white/70 mt-1">
              View and manage your transaction history
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading.transactions}
            className="bg-[#70b340] hover:bg-[#5a9235] text-white self-start sm:self-auto"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading.transactions ? "animate-spin" : ""}`} />
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
                  <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
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
                  <p className="text-sm text-white/70">Pending</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.pending}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Processing</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.processing}</p>
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
                  <p className="text-3xl font-bold text-white mt-1">{stats.completed}</p>
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
                  <p className="text-3xl font-bold text-white mt-1">{stats.failed}</p>
                </div>
                <div className="h-12 w-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
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
                  placeholder="Search by ID, recipient, currency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error state */}
        {error.transactions && (
          <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20 p-0">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-medium text-white">Error loading transactions</h3>
                  <p className="text-sm text-white/70">{error.transactions}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading.transactions}
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
        {!loading.transactions && !error.transactions && filteredTransactions.length === 0 && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 border-dashed p-0">
            <CardContent className="p-12 text-center">
              <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-white/50" />
              <p className="text-lg font-medium text-white">No transactions found</p>
              <p className="text-sm text-white/70 mt-1">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try changing your search or filter criteria"
                  : "Start your first transfer to see it here"}
              </p>
              {(searchQuery || statusFilter !== "all" || typeFilter !== "all") ? (
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
              ) : (
                <Button
                  className="mt-4 bg-[#70b340] hover:bg-[#5a9235] text-white"
                  onClick={() => router.push("/transfer")}
                >
                  Start Transfer
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transactions Table */}
        {filteredTransactions.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/90">Transaction</TableHead>
                    <TableHead className="text-white/90">Type</TableHead>
                    <TableHead className="text-white/90">From</TableHead>
                    <TableHead className="text-white/90">To</TableHead>
                    <TableHead className="text-white/90">Status</TableHead>
                    <TableHead className="text-white/90">Date</TableHead>
                    <TableHead className="text-right text-white/90">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="border-white/10 hover:bg-white/5 cursor-pointer"
                      onClick={() => router.push(`/transaction/${transaction.id}`)}
                    >
                      <TableCell>
                        <div className="font-mono text-sm text-white">
                          {transaction.id.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-white/50">
                          {transaction.fromCurrency} → {transaction.toCurrency}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-white">
                          {transaction.totalfromAmount 
                            ? formatCurrency(transaction.totalfromAmount, transaction.fromCurrency)
                            : formatCurrency(transaction.fromAmount, transaction.fromCurrency)}
                        </div>
                        {transaction.totalfromAmount ? (
                          <div className="text-xs text-white/50 line-through">
                            {formatCurrency(transaction.fromAmount, transaction.fromCurrency)}
                          </div>
                        ): null}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-[#70b340]">
                          {formatCurrency(transaction.toAmount, transaction.toCurrency)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Calendar className="h-3 w-3" />
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-white/50">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/transaction/${transaction.id}`);
                          }}
                          className="text-white hover:bg-white/10"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Load More Button */}
        {filteredTransactions.length > 0 && transactionsPagination.hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={loadMoreTransactions}
              disabled={loading.transactions}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {loading.transactions ? (
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
      </div>
    </div>
  );
}