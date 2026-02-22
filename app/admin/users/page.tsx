"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  RefreshCcw,
  Search,
  ChevronRight,
  MoreHorizontal,
  UserX,
  Shield,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Award,
  UserCheck,
  Ban
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { User, UserRole, UserStatus } from "@/types/type";
import useAdminUsers from "@/hooks/admin/useAdminUsers";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminUsersPage() {
  const { user: adminUser } = useAuth();
  const {
    fetchUsers,
    fetchUserStats,
    toggleUserStatus,
    updateUserRole,
    users,
    stats,
    loading,
    error,
    pagination,
    clearError
  } = useAdminUsers();

  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Dialogs state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'activate' | 'role' | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Load users when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search, role, and status
  useEffect(() => {
    if (!users) return;

    let filtered = [...users];

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phoneNumber?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, statusFilter, searchQuery]);

  const loadUsers = async () => {
    try {
      await Promise.all([fetchUsers({ limit: 50 }), fetchUserStats()]);
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Failed to load users");
    }
  };

  const loadMoreUsers = async () => {
    if (!pagination.hasMore) return;
    
    try {
      await fetchUsers({
        limit: 50,
        startAfter: pagination.lastDoc!
      });
    } catch (err) {
      console.error("Error loading more users:", err);
      toast.error("Failed to load more users");
    }
  };

  const handleRefresh = () => {
    clearError();
    loadUsers();
  };

  const openActionDialog = (user: User, action: 'block' | 'activate' | 'role' ) => {
    setSelectedUser(user);
    setActionType(action);
    if (action === 'role') {
      setSelectedRole(user.role);
    }
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      setProcessingAction(true);

      switch (actionType) {
        case 'block':
          await toggleUserStatus(selectedUser.id, 'blocked', adminUser?.id, adminUser?.email);
          toast.success("User blocked successfully");
          break;
        case 'activate':
          await toggleUserStatus(selectedUser.id, 'active', adminUser?.id, adminUser?.email);
          toast.success("User activated successfully");
          break;
        case 'role':
          await updateUserRole(selectedUser.id, selectedRole, adminUser?.id, adminUser?.email);
          toast.success(`User role updated to ${selectedRole}`);
          break;
      }

      setActionDialogOpen(false);
      setSelectedUser(null);
      setActionType(null);
    } catch (err) {
      console.error("Error performing action:", err);
      toast.error("Failed to perform action");
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    return role === 'admin' 
      ? <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Admin</Badge>
      : <Badge variant="secondary">User</Badge>;
  };

  const getDialogContent = () => {
    switch (actionType) {
      case 'block':
        return {
          title: "Block User",
          description: `Are you sure you want to block ${selectedUser?.name}? They will lose access to their account.`,
          actionText: "Block User",
          actionClass: "bg-red-600 hover:bg-red-700"
        };
      case 'activate':
        return {
          title: "Activate User",
          description: `Are you sure you want to activate ${selectedUser?.name}? They will regain access to their account.`,
          actionText: "Activate User",
          actionClass: "bg-[#70b340] hover:bg-[#5a9235]"
        };
      case 'role':
        return {
          title: "Change User Role",
          description: `Select a new role for ${selectedUser?.name}. This will change their permissions and access level.`,
          actionText: "Update Role",
          actionClass: "bg-[#70b340] hover:bg-[#5a9235]"
        };
      default:
        return {
          title: "",
          description: "",
          actionText: "",
          actionClass: ""
        };
    }
  };

  // Loading state
  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-white/70 mt-1">
              Manage all users registered on Adams Pay
            </p>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
            <p className="text-lg font-medium text-white">Loading Users</p>
            <p className="text-sm text-white/70 mt-1">
              Please wait while we fetch the user data...
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
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-white/70 mt-1">
            Manage all users registered on Adams Pay
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Total Users</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-[#70b340]/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-[#70b340]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Active Users</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.active}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors p-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Admins</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.admins}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-400" />
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
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setRoleFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-white bg-[#70b340] hover:bg-white/10"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search by name, email, or phone..."
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
                <h3 className="font-medium text-white">Error loading users</h3>
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
      {!loading && !error && filteredUsers.length === 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 border-dashed p-0">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-white/50" />
            <p className="text-lg font-medium text-white">No users found</p>
            <p className="text-sm text-white/70 mt-1">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Try changing your search or filter criteria"
                : "No users have registered yet"}
            </p>
            {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
              <Button 
                variant="outline" 
                className="mt-4 border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      {filteredUsers.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/90">User</TableHead>
                  <TableHead className="text-white/90">Contact</TableHead>
                  <TableHead className="text-white/90">Role</TableHead>
                  <TableHead className="text-white/90">Status</TableHead>
                  <TableHead className="text-white/90">Adam Points</TableHead>
                  <TableHead className="text-white/90">Joined</TableHead>
                  <TableHead className="text-right text-white/90">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white/20">
                          <AvatarImage src={user.profilePicture} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-br from-[#70b340] to-[#5a9235] text-white">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-xs text-white/50">ID: {user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-white/80">
                            <Phone className="h-3 w-3" />
                            {user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#70b340]" />
                        <span className="text-white font-medium">{user.adamPoints}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.addedAt).toLocaleDateString()}
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
                              setSelectedUser(user);
                              setDetailsDialogOpen(true);
                            }}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem 
                            onClick={() => openActionDialog(user, 'role')}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          {user.status === 'blocked' ? (
                            <DropdownMenuItem 
                              onClick={() => openActionDialog(user, 'activate')}
                              className="text-green-400 hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => openActionDialog(user, 'block')}
                              className="text-red-400 hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Block User
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
      {filteredUsers.length > 0 && pagination.hasMore && !searchQuery && roleFilter === "all" && statusFilter === "all" && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={loadMoreUsers}
            disabled={loading}
            className="border-white/20 text-white bg-[#70b340] hover:bg-white/10"
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
          
          {actionType === 'role' && (
            <div className="py-4">
              <Select 
                value={selectedRole} 
                onValueChange={(value) => setSelectedRole(value as UserRole)}
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2951] border-white/20 text-white">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedRole === 'admin' && (
                <div className="mt-4 flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <strong>Warning:</strong> Admins have full access to the admin panel. Only assign this role to trusted individuals.
                  </div>
                </div>
              )}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={dialogContent.actionClass}
              disabled={processingAction || (actionType === 'role' && selectedUser?.role === selectedRole)}
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

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Details</DialogTitle>
            <DialogDescription className="text-white/70">
              Complete information about this user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-[#70b340]">
                  <AvatarImage src={selectedUser.profilePicture} />
                  <AvatarFallback className="bg-gradient-to-br from-[#70b340] to-[#5a9235] text-white text-2xl">
                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <div className="flex gap-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <div className="flex flex-row flex-wrap w-full gap-4">
                    <div className="space-y-1">
                    <p className="text-sm text-white/50">Email</p>
                    <p className="text-white">{selectedUser.email}</p>
                    </div>
                    {selectedUser.phoneNumber && (
                    <div className="space-y-1">
                        <p className="text-sm text-white/50">Phone</p>
                        <p className="text-white">{selectedUser.phoneNumber}</p>
                    </div>
                    )}
             </div>
              <div className="grid grid-cols-2 gap-4">     
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Adam Points</p>
                  <p className="text-white font-semibold">{selectedUser.adamPoints}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Referral Code</p>
                  <p className="text-white font-mono">{selectedUser.referralCode}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Referrals</p>
                  <p className="text-white">{selectedUser.referrals.length} users</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Joined</p>
                  <p className="text-white">{new Date(selectedUser.addedAt).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Last Updated</p>
                  <p className="text-white">{new Date(selectedUser.updatedAt).toLocaleString()}</p>
                </div>
                {selectedUser.lastLoginAt && (
                  <div className="space-y-1">
                    <p className="text-sm text-white/50">Last Login</p>
                    <p className="text-white">{new Date(selectedUser.lastLoginAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-white/50">Notifications</p>
                <div className="flex gap-4">
                  <Badge variant={selectedUser.notifications.newsAndUpdates ? "default" : "outline"}>
                    News & Updates: {selectedUser.notifications.newsAndUpdates ? "On" : "Off"}
                  </Badge>
                  <Badge variant={selectedUser.notifications.promotions ? "default" : "outline"}>
                    Promotions: {selectedUser.notifications.promotions ? "On" : "Off"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-white/50">Security</p>
                <Badge variant={'default'} className="">
                  Biometrics: {selectedUser.security.biometricsEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}