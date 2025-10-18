"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ArrowUpDown,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Calendar,
  Mail,
  Eye,
  RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useAdminUsers from "@/hooks/admin/useAdminUsers";
import useAdminTransactions from "@/hooks/admin/useAdminTransactions";
import useAdminRates from "@/hooks/admin/useAdminRates";

export default function AdminDashboardPage() {
  const {
    fetchUsers,
    users,
    loading: usersLoading,
  } = useAdminUsers();

  const {
    fetchTransactions,
    transactions,
    loading: transactionsLoading,
  } = useAdminTransactions();

  const {
    fetchExchangeRates,
    exchangeRates,
    loading: ratesLoading,
  } = useAdminRates();

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        fetchUsers({ limit: 10 }),
        fetchTransactions({ limit: 10 }),
        fetchExchangeRates()
      ]);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalTransactions: transactions.length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    processingTransactions: transactions.filter(t => t.status === 'processing').length,
    completedTransactions: transactions.filter(t => t.status === 'completed').length,
    failedTransactions: transactions.filter(t => t.status === 'failed' || t.status === 'cancelled').length,
    activeRates: exchangeRates.filter(r => r.enabled).length,
    totalRates: exchangeRates.length,
  };

  // Calculate total transaction volume
  const totalVolume = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.fromAmount, 0);

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Recent users (last 5)
  const recentUsers = users.slice(0, 5);

  const getTransactionStatusBadge = (status: string) => {
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

  const loading = usersLoading || transactionsLoading || ratesLoading;

  // Loading state
  if (loading && users.length === 0 && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/70 mt-1">Overview of Adams Pay</p>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
            <p className="text-lg font-medium text-white">Loading Dashboard</p>
            <p className="text-sm text-white/70 mt-1">
              Please wait while we fetch the data...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/70 mt-1">Overview of Adams Pay</p>
        </div>
        <Button 
          onClick={loadDashboardData}
          disabled={loading}
          variant="outline"
          className="border-white/20 bg-transparent text-white hover:bg-white/10"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Total Users</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</p>
                <p className="text-xs text-white/60 mt-1">
                  {stats.activeUsers} active
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Transactions</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalTransactions}</p>
                <p className="text-xs text-white/60 mt-1">
                  {stats.pendingTransactions} pending
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <ArrowUpDown className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Volume */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Total Volume</p>
                <p className="text-3xl font-bold text-white mt-1">
                  ${totalVolume.toLocaleString()}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {stats.completedTransactions} completed
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rates */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Exchange Rates</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalRates}</p>
                <p className="text-xs text-white/60 mt-1">
                  {stats.activeRates} active
                </p>
              </div>
              <div className="h-12 w-12 bg-[#70b340]/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#70b340]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-white/70">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pendingTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/70">Processing</p>
                <p className="text-2xl font-bold text-white">{stats.processingTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white/70">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completedTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white/70">Failed</p>
                <p className="text-2xl font-bold text-white">{stats.failedTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/users">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer group p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Users className="h-8 w-8 text-[#70b340] mb-2" />
                  <p className="text-white font-semibold">User Management</p>
                  <p className="text-sm text-white/60 mt-1">Manage all users</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-[#70b340] group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/transactions">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer group p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <ArrowUpDown className="h-8 w-8 text-[#70b340] mb-2" />
                  <p className="text-white font-semibold">Transactions</p>
                  <p className="text-sm text-white/60 mt-1">View all transactions</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-[#70b340] group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/rates">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer group p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <TrendingUp className="h-8 w-8 text-[#70b340] mb-2" />
                  <p className="text-white font-semibold">Exchange Rates</p>
                  <p className="text-sm text-white/60 mt-1">Manage rates</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-[#70b340] group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/bulk-mailer">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all cursor-pointer group p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Mail className="h-8 w-8 text-[#70b340] mb-2" />
                  <p className="text-white font-semibold">Bulk Mailer</p>
                  <p className="text-sm text-white/60 mt-1">Send emails</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-[#70b340] group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Transactions</CardTitle>
                <CardDescription className="text-white/70">
                  Latest transaction activity
                </CardDescription>
              </div>
              <Link href="/admin/transactions">
                <Button variant="ghost" size="sm" className="text-[#70b340] hover:bg-white/10">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-[#70b340] to-[#5a9235] rounded-lg flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {transaction.fromAmount} {transaction.fromCurrency} → {transaction.toAmount} {transaction.toCurrency}
                        </p>
                        <p className="text-xs text-white/60">
                          {transaction.recipientDetails?.fullName || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getTransactionStatusBadge(transaction.status)}
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Users</CardTitle>
                <CardDescription className="text-white/70">
                  Newly registered users
                </CardDescription>
              </div>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="text-[#70b340] hover:bg-white/10">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white/20">
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback className="bg-gradient-to-br from-[#70b340] to-[#5a9235] text-white">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-white/60">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(user.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#70b340]" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <div>
                <p className="text-sm font-medium text-white">User Service</p>
                <p className="text-xs text-white/60">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <div>
                <p className="text-sm font-medium text-white">Transaction Service</p>
                <p className="text-xs text-white/60">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <div>
                <p className="text-sm font-medium text-white">Email Service</p>
                <p className="text-xs text-white/60">Operational</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}