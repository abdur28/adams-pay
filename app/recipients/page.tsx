"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  RefreshCcw,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  StarOff,
  User,
  Mail,
  Phone,
  Building2,
  CreditCard,
  Loader2,
  AlertTriangle,
  Users,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import useData from "@/hooks/useData";
import useActions from "@/hooks/useActions";
import { SavedRecipient } from "@/types/type";

interface RecipientFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const emptyFormData: RecipientFormData = {
  fullName: "",
  email: "",
  phoneNumber: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
};

export default function RecipientsPage() {
  const { user } = useAuth();

  const {
    fetchRecipients,
    refreshRecipients,
    recipients,
    defaultRecipient,
    loading,
    error,
    clearRecipientsError,
  } = useData();

  const {
    saveRecipient,
    updateRecipient,
    deleteRecipient,
    setDefaultRecipient,
    loading: actionLoading,
    error: actionError,
    clearRecipientError,
  } = useActions();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRecipients, setFilteredRecipients] = useState<SavedRecipient[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<SavedRecipient | null>(null);
  const [formData, setFormData] = useState<RecipientFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Partial<RecipientFormData>>({});

  // Load recipients on mount
  useEffect(() => {
    if (user?.id) {
      loadRecipients();
    }
  }, [user?.id]);

  // Filter recipients
  useEffect(() => {
    if (!recipients) return;

    let filtered = [...recipients];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (recipient) =>
          recipient.fullName.toLowerCase().includes(query) ||
          recipient.email.toLowerCase().includes(query) ||
          recipient.phoneNumber.includes(query) ||
          recipient.bankName.toLowerCase().includes(query) ||
          recipient.accountNumber.toLowerCase().includes(query) ||
          recipient.accountName.toLowerCase().includes(query)
      );
    }

    setFilteredRecipients(filtered);
  }, [recipients, searchQuery]);

  const loadRecipients = async () => {
    if (!user?.id) return;

    try {
      await fetchRecipients(user.id);
    } catch (err) {
      console.error("Error loading recipients:", err);
      toast.error("Failed to load recipients");
    }
  };

  const handleRefresh = () => {
    clearRecipientsError();
    clearRecipientError();
    if (user?.id) {
      refreshRecipients(user.id);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<RecipientFormData> = {};

    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
    if (!formData.bankName.trim()) errors.bankName = "Bank name is required";
    if (!formData.accountNumber.trim()) errors.accountNumber = "Account number is required";
    if (!formData.accountName.trim()) errors.accountName = "Account name is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRecipient = async () => {
    if (!user?.id) return;
    if (!validateForm()) return;

    const result = await saveRecipient({
      userId: user.id,
      ...formData,
      isDefault: false,
    });

    if (result.success) {
      toast.success("Recipient added successfully!");
      setShowAddDialog(false);
      setFormData(emptyFormData);
      setFormErrors({});
      loadRecipients();
    } else {
      toast.error(result.error || "Failed to add recipient");
    }
  };

  const handleEditRecipient = async () => {
    if (!selectedRecipient) return;
    if (!validateForm()) return;

    const result = await updateRecipient(selectedRecipient.id, formData);

    if (result.success) {
      toast.success("Recipient updated successfully!");
      setShowEditDialog(false);
      setSelectedRecipient(null);
      setFormData(emptyFormData);
      setFormErrors({});
      loadRecipients();
    } else {
      toast.error(result.error || "Failed to update recipient");
    }
  };

  const handleDeleteRecipient = async () => {
    if (!selectedRecipient) return;

    const result = await deleteRecipient(selectedRecipient.id);

    if (result.success) {
      toast.success("Recipient deleted successfully!");
      setShowDeleteDialog(false);
      setSelectedRecipient(null);
      loadRecipients();
    } else {
      toast.error(result.error || "Failed to delete recipient");
    }
  };

  const handleSetDefault = async (recipientId: string) => {
    if (!user?.id) return;

    const result = await setDefaultRecipient(recipientId, user.id);

    if (result.success) {
      toast.success("Default recipient updated!");
      loadRecipients();
    } else {
      toast.error(result.error || "Failed to set default recipient");
    }
  };

  const openEditDialog = (recipient: SavedRecipient) => {
    setSelectedRecipient(recipient);
    setFormData({
      fullName: recipient.fullName,
      email: recipient.email,
      phoneNumber: recipient.phoneNumber,
      bankName: recipient.bankName,
      accountNumber: recipient.accountNumber,
      accountName: recipient.accountName,
    });
    setFormErrors({});
    setShowEditDialog(true);
  };

  const openDeleteDialog = (recipient: SavedRecipient) => {
    setSelectedRecipient(recipient);
    setShowDeleteDialog(true);
  };

  const openAddDialog = () => {
    setFormData(emptyFormData);
    setFormErrors({});
    setShowAddDialog(true);
  };

  // Loading state
  if (loading.recipients && recipients.length === 0) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a] mt-20">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
              <p className="text-lg font-medium text-white">Loading Recipients</p>
              <p className="text-sm text-white/70 mt-1">
                Please wait while we fetch your saved recipients...
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
            <h1 className="text-3xl font-bold text-white">Saved Recipients</h1>
            <p className="text-white/70 mt-1">
              Manage your saved recipients for faster transfers
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button
              onClick={handleRefresh}
              disabled={loading.recipients}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <RefreshCcw
                className={`h-4 w-4 mr-2 ${loading.recipients ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={openAddDialog}
              className="bg-[#70b340] hover:bg-[#5a9235] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Recipient
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Total Recipients</p>
                  <p className="text-3xl font-bold text-white mt-1">{recipients.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Default Recipient</p>
                  <p className="text-lg font-semibold text-white mt-1 truncate max-w-[200px]">
                    {defaultRecipient ? defaultRecipient.fullName : "Not set"}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search recipients by name, email, phone, bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error state */}
        {(error.recipients || actionError.recipient) && (
          <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20 p-0">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-medium text-white">Error</h3>
                  <p className="text-sm text-white/70">
                    {error.recipients || actionError.recipient}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading.recipients}
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
        {!loading.recipients &&
          !error.recipients &&
          filteredRecipients.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 border-dashed p-0">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-white/50" />
                <p className="text-lg font-medium text-white">
                  {searchQuery ? "No recipients found" : "No saved recipients yet"}
                </p>
                <p className="text-sm text-white/70 mt-1">
                  {searchQuery
                    ? "Try changing your search criteria"
                    : "Add your first recipient to make transfers faster"}
                </p>
                {searchQuery ? (
                  <Button
                    variant="outline"
                    className="mt-4 border-white/20 text-white hover:bg-white/10 bg-transparent"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Button
                    className="mt-4 bg-[#70b340] hover:bg-[#5a9235] text-white"
                    onClick={openAddDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Recipient
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

        {/* Recipients Grid */}
        {filteredRecipients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipients.map((recipient) => (
              <Card
                key={recipient.id}
                className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all hover:scale-[1.02] "
              >
                <CardHeader className="">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-[#70b340]/20 rounded-xl flex items-center justify-center">
                        <User className="h-6 w-6 text-[#70b340]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-white text-lg truncate">
                          {recipient.fullName}
                        </CardTitle>
                        {recipient.isDefault && (
                          <Badge className="mt-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white hover:bg-white/10"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#1a2951] border-white/20 text-white"
                      >
                        {!recipient.isDefault && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleSetDefault(recipient.id)}
                              className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                            >
                              <Star className="h-4 w-4 mr-2 text-yellow-400" />
                              Set as Default
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => openEditDialog(recipient)}
                          className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(recipient)}
                          className="text-red-400 hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 ">
                  <Separator className="bg-white/10" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-white/50" />
                      <span className="text-white/70 truncate">{recipient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-white/50" />
                      <span className="text-white/70">{recipient.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-white/50" />
                      <span className="text-white/70 truncate">{recipient.bankName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-white/50" />
                      <span className="text-white/70 font-mono">
                        {recipient.accountNumber}
                      </span>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <p className="text-xs text-white/50">Account Name</p>
                    <p className="text-sm text-white font-medium truncate">
                      {recipient.accountName}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setFormData(emptyFormData);
            setFormErrors({});
            setSelectedRecipient(null);
          }
        }}
      >
        <DialogContent className="bg-[#1a2951] border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              {showEditDialog ? "Edit Recipient" : "Add New Recipient"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {showEditDialog
                ? "Update recipient information"
                : "Enter the recipient's details to save them for future transfers"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">
                Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className={`bg-white/5 border-white/20 text-white placeholder:text-white/50 ${
                  formErrors.fullName ? "border-red-500" : ""
                }`}
              />
              {formErrors.fullName && (
                <p className="text-red-400 text-sm">{formErrors.fullName}</p>
              )}
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`bg-white/5 border-white/20 text-white placeholder:text-white/50 ${
                    formErrors.email ? "border-red-500" : ""
                  }`}
                />
                {formErrors.email && (
                  <p className="text-red-400 text-sm">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-white">
                  Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className={`bg-white/5 border-white/20 text-white placeholder:text-white/50 ${
                    formErrors.phoneNumber ? "border-red-500" : ""
                  }`}
                />
                {formErrors.phoneNumber && (
                  <p className="text-red-400 text-sm">{formErrors.phoneNumber}</p>
                )}
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Bank Name */}
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-white">
                Bank Name *
              </Label>
              <Input
                id="bankName"
                placeholder="Example Bank"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                className={`bg-white/5 border-white/20 text-white placeholder:text-white/50 ${
                  formErrors.bankName ? "border-red-500" : ""
                }`}
              />
              {formErrors.bankName && (
                <p className="text-red-400 text-sm">{formErrors.bankName}</p>
              )}
            </div>

            {/* Account Number and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-white">
                  Account Number *
                </Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  className={`bg-white/5 border-white/20 text-white placeholder:text-white/50 ${
                    formErrors.accountNumber ? "border-red-500" : ""
                  }`}
                />
                {formErrors.accountNumber && (
                  <p className="text-red-400 text-sm">{formErrors.accountNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-white">
                  Account Name *
                </Label>
                <Input
                  id="accountName"
                  placeholder="John Doe"
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                  className={`bg-white/5 border-white/20 text-white placeholder:text-white/50 ${
                    formErrors.accountName ? "border-red-500" : ""
                  }`}
                />
                {formErrors.accountName && (
                  <p className="text-red-400 text-sm">{formErrors.accountName}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                setFormData(emptyFormData);
                setFormErrors({});
                setSelectedRecipient(null);
              }}
              disabled={actionLoading.recipient}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={showEditDialog ? handleEditRecipient : handleAddRecipient}
              disabled={actionLoading.recipient}
              className="bg-[#70b340] hover:bg-[#5a9235] text-white"
            >
              {actionLoading.recipient ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {showEditDialog ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {showEditDialog ? "Update Recipient" : "Add Recipient"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1a2951] border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Recipient?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {selectedRecipient?.fullName}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white bg-transparent hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecipient}
              disabled={actionLoading.recipient}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading.recipient ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}