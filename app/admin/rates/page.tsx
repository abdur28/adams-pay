"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  RefreshCcw,
  Search,
  MoreHorizontal,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Plus,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Building2,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ExchangeRate, PaymentMethodInfo, CURRENCIES } from "@/types/exchange";
import useAdminRates from "@/hooks/admin/useAdminRates";

export default function AdminRatesPage() {
  const {
    fetchExchangeRates,
    createExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    toggleRateStatus,
    exchangeRates,
    loading,
    error,
    clearError
  } = useAdminRates();

  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredRates, setFilteredRates] = useState<ExchangeRate[]>([]);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Dialogs state
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fromCurrency: '',
    toCurrency: '',
    rate: '',
    minAmount: '',
    maxAmount: '',
    enabled: true,
    paymentMethods: [] as PaymentMethodInfo[]
  });

  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethodInfo>({
    id: '',
    name: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    instructions: ''
  });

  // Load rates when component mounts
  useEffect(() => {
    loadRates();
  }, []);

  // Filter rates based on search and status
  useEffect(() => {
    if (!exchangeRates) return;

    let filtered = [...exchangeRates];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(rate => 
        statusFilter === "enabled" ? rate.enabled : !rate.enabled
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rate => 
        rate.fromCurrency.toLowerCase().includes(query) ||
        rate.toCurrency.toLowerCase().includes(query) ||
        rate.rate.toString().includes(query)
      );
    }

    setFilteredRates(filtered);
  }, [exchangeRates, statusFilter, searchQuery]);

  const loadRates = async () => {
    try {
      await fetchExchangeRates();
    } catch (err) {
      console.error("Error loading rates:", err);
      toast.error("Failed to load exchange rates");
    }
  };

  const handleRefresh = () => {
    clearError();
    loadRates();
  };

  const handleToggleStatus = async (rate: ExchangeRate) => {
    try {
      setProcessingAction(true);
      await toggleRateStatus(rate.id, !rate.enabled);
      toast.success(`Rate ${!rate.enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      console.error("Error toggling rate status:", err);
      toast.error("Failed to update rate status");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRate) return;
    
    try {
      setProcessingAction(true);
      await deleteExchangeRate(selectedRate.id);
      toast.success("Exchange rate deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedRate(null);
    } catch (err) {
      console.error("Error deleting rate:", err);
      toast.error("Failed to delete exchange rate");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleOpenEditDialog = (rate: ExchangeRate) => {
    setSelectedRate(rate);
    setFormData({
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate.toString(),
      minAmount: rate.minAmount.toString(),
      maxAmount: rate.maxAmount.toString(),
      enabled: rate.enabled,
      paymentMethods: rate.paymentMethods || []
    });
    setEditDialogOpen(true);
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      fromCurrency: '',
      toCurrency: '',
      rate: '',
      minAmount: '',
      maxAmount: '',
      enabled: true,
      paymentMethods: []
    });
    setCreateDialogOpen(true);
  };

  const handleAddPaymentMethod = () => {
    if (!newPaymentMethod.name || !newPaymentMethod.accountNumber) {
      toast.error("Please fill in payment method name and account number");
      return;
    }

    const paymentMethod: PaymentMethodInfo = {
      ...newPaymentMethod,
      id: Date.now().toString()
    };

    setFormData(prev => ({
      ...prev,
      paymentMethods: [...prev.paymentMethods, paymentMethod]
    }));

    setNewPaymentMethod({
      id: '',
      name: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      instructions: ''
    });
  };

  const handleRemovePaymentMethod = (id: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter(pm => pm.id !== id)
    }));
  };

  const handleSubmitCreate = async () => {
    if (!formData.fromCurrency || !formData.toCurrency || !formData.rate || !formData.minAmount || !formData.maxAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setProcessingAction(true);
      await createExchangeRate({
        fromCurrency: formData.fromCurrency,
        toCurrency: formData.toCurrency,
        rate: parseFloat(formData.rate),
        minAmount: parseFloat(formData.minAmount),
        maxAmount: parseFloat(formData.maxAmount),
        enabled: formData.enabled,
        paymentMethods: formData.paymentMethods,
        lastUpdated: new Date().toISOString()
      });
      toast.success("Exchange rate created successfully");
      setCreateDialogOpen(false);
    } catch (err) {
      console.error("Error creating rate:", err);
      toast.error("Failed to create exchange rate");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedRate) return;

    try {
      setProcessingAction(true);
      await updateExchangeRate(selectedRate.id, {
        fromCurrency: formData.fromCurrency,
        toCurrency: formData.toCurrency,
        rate: parseFloat(formData.rate),
        minAmount: parseFloat(formData.minAmount),
        maxAmount: parseFloat(formData.maxAmount),
        enabled: formData.enabled,
        paymentMethods: formData.paymentMethods,
      });
      toast.success("Exchange rate updated successfully");
      setEditDialogOpen(false);
      setSelectedRate(null);
    } catch (err) {
      console.error("Error updating rate:", err);
      toast.error("Failed to update exchange rate");
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (enabled: boolean) => {
    return enabled 
      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enabled</Badge>
      : <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Disabled</Badge>;
  };

  // Loading state
  if (loading && exchangeRates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Exchange Rates</h1>
            <p className="text-white/70 mt-1">
              Manage exchange rates for Adams Pay
            </p>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
            <p className="text-lg font-medium text-white">Loading Exchange Rates</p>
            <p className="text-sm text-white/70 mt-1">
              Please wait while we fetch the rates data...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Exchange Rates</h1>
          <p className="text-white/70 mt-1">
            Manage exchange rates for Adams Pay
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={loading} 
            variant="outline"
            className="border-white/20 text-white bg-transparent hover:bg-white/10"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleOpenCreateDialog}
            className="bg-[#70b340] hover:bg-[#5a9235] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Rate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Total Rates</p>
                <p className="text-3xl font-bold text-white mt-1">{exchangeRates.length}</p>
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
                <p className="text-sm text-white/70">Active Rates</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {exchangeRates.filter(r => r.enabled).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <ToggleRight className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Disabled Rates</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {exchangeRates.filter(r => !r.enabled).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-gray-500/20 rounded-xl flex items-center justify-center">
                <ToggleLeft className="h-6 w-6 text-gray-400" />
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
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== "all" || searchQuery) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setStatusFilter("all");
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
                placeholder="Search by currency or rate..."
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
                <h3 className="font-medium text-white">Error loading rates</h3>
                <p className="text-sm text-white/70">{error}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={loading}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filteredRates.length === 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 border-dashed p-0">
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-white/50" />
            <p className="text-lg font-medium text-white">No exchange rates found</p>
            <p className="text-sm text-white/70 mt-1">
              {searchQuery || statusFilter !== "all"
                ? "Try changing your search or filter criteria"
                : "Get started by adding your first exchange rate"}
            </p>
            <Button 
              onClick={handleOpenCreateDialog}
              className="mt-4 bg-[#70b340] hover:bg-[#5a9235]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rates table */}
      {filteredRates.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/90">From Currency</TableHead>
                  <TableHead className="text-white/90">To Currency</TableHead>
                  <TableHead className="text-white/90">Exchange Rate</TableHead>
                  <TableHead className="text-white/90">Payment Methods</TableHead>
                  <TableHead className="text-white/90">Status</TableHead>
                  <TableHead className="text-white/90">Last Updated</TableHead>
                  <TableHead className="text-right text-white/90">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRates.map((rate) => (
                  <TableRow key={rate.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{rate.fromCurrency}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{rate.toCurrency}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white font-mono">{rate.rate}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {rate.paymentMethods?.length || 0} methods
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(rate.enabled)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-white/80">
                        {new Date(rate.lastUpdated).toLocaleDateString()}
                      </span>
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
                              setSelectedRate(rate);
                              setDetailsDialogOpen(true);
                            }}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleOpenEditDialog(rate)}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Rate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(rate)}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            {rate.enabled ? (
                              <>
                                <ToggleLeft className="h-4 w-4 mr-2" />
                                Disable
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-4 w-4 mr-2" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedRate(rate);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a2951] border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exchange Rate</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this exchange rate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={processingAction}
            >
              {processingAction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setSelectedRate(null);
        }
      }}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editDialogOpen ? 'Edit Exchange Rate' : 'Create Exchange Rate'}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {editDialogOpen ? 'Update the exchange rate details' : 'Add a new exchange rate to the system'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Currency Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/90">From Currency *</Label>
                <Select 
                  value={formData.fromCurrency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, fromCurrency: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90">To Currency *</Label>
                <Select 
                  value={formData.toCurrency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, toCurrency: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rate */}
            <div className="space-y-2">
              <Label className="text-white/90">Exchange Rate *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                placeholder="1.00"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {/* Min and Max Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/90">Minimum Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minAmount: e.target.value }))}
                  placeholder="10"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/90">Maximum Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxAmount: e.target.value }))}
                  placeholder="10000"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>

            {/* Enabled Status */}
            <div className="flex items-center justify-between">
              <Label className="text-white/90">Enable this rate</Label>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <Label className="text-white/90">Payment Methods</Label>
              
              {/* Existing Payment Methods */}
              {formData.paymentMethods.length > 0 && (
                <div className="space-y-2">
                  {formData.paymentMethods.map((pm) => (
                    <Card key={pm.id} className="bg-white/5 border-white/10 p-0">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-white font-medium">{pm.name}</p>
                            <p className="text-xs text-white/70">{pm.bankName} - {pm.accountNumber}</p>
                            <p className="text-xs text-white/60">{pm.accountName}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemovePaymentMethod(pm.id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add New Payment Method */}
              <Card className="bg-white/5 border-white/10 p-0">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium text-white/90">Add Payment Method</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Method Name *"
                      value={newPaymentMethod.name}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Input
                      placeholder="Bank Name"
                      value={newPaymentMethod.bankName}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, bankName: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Input
                      placeholder="Account Number *"
                      value={newPaymentMethod.accountNumber}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Input
                      placeholder="Account Name"
                      value={newPaymentMethod.accountName}
                      onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, accountName: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <Input
                    placeholder="Instructions (optional)"
                    value={newPaymentMethod.instructions}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, instructions: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Button
                    type="button"
                    onClick={handleAddPaymentMethod}
                    variant="outline"
                    className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                setSelectedRate(null);
              }}
              className="border-white/20 text-white bg-transparent hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={editDialogOpen ? handleSubmitEdit : handleSubmitCreate}
              disabled={processingAction || !formData.fromCurrency || !formData.toCurrency || !formData.rate || !formData.minAmount || !formData.maxAmount}
              className="bg-[#70b340] hover:bg-[#5a9235]"
            >
              {processingAction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editDialogOpen ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editDialogOpen ? 'Update Rate' : 'Create Rate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Exchange Rate Details</DialogTitle>
          </DialogHeader>
          
          {selectedRate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-white/50">From Currency</p>
                  <p className="text-white font-semibold text-lg">{selectedRate.fromCurrency}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">To Currency</p>
                  <p className="text-white font-semibold text-lg">{selectedRate.toCurrency}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Exchange Rate</p>
                  <p className="text-white font-mono font-semibold text-lg">{selectedRate.rate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Status</p>
                  {getStatusBadge(selectedRate.enabled)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Minimum Amount</p>
                  <p className="text-white font-semibold">{selectedRate.minAmount} {selectedRate.fromCurrency}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Maximum Amount</p>
                  <p className="text-white font-semibold">{selectedRate.maxAmount} {selectedRate.fromCurrency}</p>
                </div>
              </div>

              {selectedRate.paymentMethods && selectedRate.paymentMethods.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#70b340]" />
                    Payment Methods
                  </h3>
                  <div className="space-y-2">
                    {selectedRate.paymentMethods.map((pm) => (
                      <Card key={pm.id} className="bg-white/5 border-white/10 p-0">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-[#70b340]" />
                              <p className="text-white font-medium">{pm.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-white/50">Bank Name</p>
                                <p className="text-white">{pm.bankName || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-white/50">Account Number</p>
                                <p className="text-white font-mono">{pm.accountNumber}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-white/50">Account Name</p>
                                <p className="text-white">{pm.accountName || 'N/A'}</p>
                              </div>
                              {pm.instructions && (
                                <div className="col-span-2">
                                  <p className="text-white/50">Instructions</p>
                                  <p className="text-white/80 text-xs">{pm.instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-white/50">Created</p>
                  <p className="text-white">{new Date(selectedRate.createdAt).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-white/50">Last Updated</p>
                  <p className="text-white">{new Date(selectedRate.lastUpdated).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}