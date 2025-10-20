"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Bell,
  Shield,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Gift,
  LogOut,
  Fingerprint,
  Settings as SettingsIcon,
  Edit,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import useActions from "@/hooks/useActions";

export default function SettingsPage() {
  const { user, changePassword, signOut, refetch } = useAuth();
  
  const {
    updateProfile,
    updateNotificationSettings,
    updateSecuritySettings,
    uploadProfilePicture,
    deleteProfilePicture,
    loading,
    error,
    uploadProgress,
    clearSettingsError,
    clearUploadError,
  } = useActions();

  // Profile state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [profileChanged, setProfileChanged] = useState(false);

  // Password state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Profile picture state
  const [showPictureDialog, setShowPictureDialog] = useState(false);
  const [selectedPicture, setSelectedPicture] = useState<File | null>(null);
  const [picturePreview, setpicturePreview] = useState<string>("");

  // Notification state
  const [notifications, setNotifications] = useState({
    newsAndUpdates: false,
    promotions: false,
  });

  // Security state
  const [security, setSecurity] = useState({
    biometricsEnabled: false,
  });

  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Initialize data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
      setNotifications({
        newsAndUpdates: user.notifications?.newsAndUpdates ?? false,
        promotions: user.notifications?.promotions ?? false,
      });
      setSecurity({
        biometricsEnabled: user.security?.biometricsEnabled ?? false,
      });
    }
  }, [user]);

  // Track profile changes
  useEffect(() => {
    if (user) {
      const hasChanged =
        profileData.name !== (user.name || "") ||
        profileData.phoneNumber !== (user.phoneNumber || "");
      setProfileChanged(hasChanged);
    }
  }, [profileData, user]);

  const handleProfileUpdate = async () => {
    if (!user?.id) return;

    const result = await updateProfile(user.id, {
      name: profileData.name,
      phoneNumber: profileData.phoneNumber,
    });

    if (result.success) {
      toast.success("Profile updated successfully!");
      setProfileChanged(false);
    } else {
      toast.error(result.error || "Failed to update profile");
    }
  };

  const handlePasswordChange = async () => {
    // Reset errors
    setPasswordErrors([]);

    // Validation
    const errors: string[] = [];
    if (!passwordData.newPassword) {
      errors.push("New password is required");
    } else if (passwordData.newPassword.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const result = await changePassword(passwordData.newPassword);

    if (result.success) {
      toast.success("Password changed successfully!");
      setShowPasswordDialog(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
      setPasswordErrors([]);
    } else {
      toast.error(result.error || "Failed to change password");
    }
  };

  const handlePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only images (JPEG, PNG, WebP) are allowed");
        return;
      }

      setSelectedPicture(file);
      setpicturePreview(URL.createObjectURL(file));
    }
  };

  const handlePictureUpload = async () => {
    if (!selectedPicture || !user?.id) return;

    const result = await uploadProfilePicture(user.id, selectedPicture);
    refetch();

    if (result.success) {
      toast.success("Profile picture updated!");
      setShowPictureDialog(false);
      setSelectedPicture(null);
      setpicturePreview("");
    } else {
      toast.error(result.error || "Failed to upload picture");
    }
  };

  const handlePictureDelete = async () => {
    if (!user?.id) return;

    const result = await deleteProfilePicture(user.id);
    refetch();

    if (result.success) {
      toast.success("Profile picture deleted!");
    } else {
      toast.error(result.error || "Failed to delete picture");
    }
  };

  const handleNotificationUpdate = async (key: keyof typeof notifications, value: boolean) => {
    if (!user?.id) return;

    setNotifications((prev) => ({ ...prev, [key]: value }));

    const result = await updateNotificationSettings(user.id, { [key]: value });

    if (result.success) {
      toast.success("Notification settings updated!");
    } else {
      toast.error(result.error || "Failed to update settings");
      // Revert on error
      setNotifications((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const handleSecurityUpdate = async (key: keyof typeof security, value: boolean) => {
    if (!user?.id) return;

    setSecurity((prev) => ({ ...prev, [key]: value }));

    const result = await updateSecuritySettings(user.id, { [key]: value });

    if (result.success) {
      toast.success("Security settings updated!");
    } else {
      toast.error(result.error || "Failed to update settings");
      // Revert on error
      setSecurity((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (!result.success) {
      toast.error(result.error || "Failed to logout");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a] pt-32">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
              <p className="text-lg font-medium text-white">Loading Settings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a]">
      <div className="max-w-4xl mx-auto space-y-6 mt-24">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-[#70b340]" />
            Settings
          </h1>
          <p className="text-white/70 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Error Alert */}
        {(error.settings || error.upload) && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-white/90">
              {error.settings || error.upload}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-xl border border-white/20 p-1">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-[#70b340] data-[state=active]:text-white text-white/70"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-[#70b340] data-[state=active]:text-white text-white/70"
            >
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-[#70b340] data-[state=active]:text-white text-white/70"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="data-[state=active]:bg-[#70b340] data-[state=active]:text-white text-white/70"
            >
              <Gift className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Picture */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Camera className="h-5 w-5 text-[#70b340]" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-4 border-white/20">
                    <AvatarImage src={user.profilePicture} alt={user.name} className="object-cover"/>
                    <AvatarFallback className="bg-[#70b340] text-white text-2xl">
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <p className="text-white/70 text-sm">
                      JPG, PNG or WebP. Max size 5MB
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowPictureDialog(true)}
                        size="sm"
                        className="bg-[#70b340] hover:bg-[#5a9235] text-white"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Change Picture
                      </Button>
                      {user.profilePicture && (
                        <Button
                          onClick={handlePictureDelete}
                          disabled={loading.upload}
                          size="sm"
                          variant="outline"
                          className="border-red-500/20 text-red-400 hover:bg-red-500/10 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-[#70b340]" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-white/70">
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-white/5 border-white/20 text-white/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/50">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phoneNumber: e.target.value })
                    }
                    placeholder="+1234567890"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                {profileChanged && (
                  <Button
                    onClick={handleProfileUpdate}
                    disabled={loading.settings}
                    className="w-full bg-[#70b340] hover:bg-[#5a9235] text-white"
                  >
                    {loading.settings ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Password */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#70b340]" />
                  Password
                </CardTitle>
                <CardDescription className="text-white/70">
                  Keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowPasswordDialog(true)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </CardContent>
            </Card>

            {/* Biometrics */}
            {/* <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-[#70b340]" />
                  Biometric Authentication
                </CardTitle>
                <CardDescription className="text-white/70">
                  Use fingerprint or face recognition to sign in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-white font-medium">Enable Biometrics</p>
                    <p className="text-sm text-white/70">
                      Use biometric authentication for quick access
                    </p>
                  </div>
                  <Switch
                    checked={security.biometricsEnabled}
                    onCheckedChange={(value) =>
                      handleSecurityUpdate("biometricsEnabled", value)
                    }
                    disabled={loading.settings}
                  />
                </div>
              </CardContent>
            </Card> */}

            {/* Active Sessions */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#70b340]" />
                  Active Sessions
                </CardTitle>
                <CardDescription className="text-white/70">
                  Manage your active login sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-white font-medium">Current Session</p>
                      <p className="text-sm text-white/70">
                        Last active: {new Date(user.lastLoginAt || user.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/20">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#70b340]" />
                  Email Notifications
                </CardTitle>
                <CardDescription className="text-white/70">
                  Choose what emails you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-white font-medium">News and Updates</p>
                    <p className="text-sm text-white/70">
                      Get notified about new features and updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.newsAndUpdates}
                    onCheckedChange={(value) =>
                      handleNotificationUpdate("newsAndUpdates", value)
                    }
                    disabled={loading.settings}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-white font-medium">Promotions</p>
                    <p className="text-sm text-white/70">
                      Receive promotional offers and special deals
                    </p>
                  </div>
                  <Switch
                    checked={notifications.promotions}
                    onCheckedChange={(value) =>
                      handleNotificationUpdate("promotions", value)
                    }
                    disabled={loading.settings}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Account Overview */}
            <Card className="bg-gradient-to-br from-[#70b340]/20 to-[#5a9235]/20 backdrop-blur-xl border-[#70b340]/30 ">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gift className="h-5 w-5 text-[#70b340]" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-white/70 text-sm">Adam Points</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {user.adamPoints || 0}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-white/70 text-sm">Referral Code</p>
                    <p className="text-xl font-mono font-bold text-[#70b340] mt-1">
                      {user.referralCode}
                    </p>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Account Status</span>
                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {user.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Member Since</span>
                    <span className="text-white">
                      {new Date(user.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Last Login</span>
                    <span className="text-white">
                      {new Date(user.lastLoginAt || user.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20 ">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-white/70">
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-red-500/20">
                  <div>
                    <p className="text-white font-medium">Sign Out</p>
                    <p className="text-sm text-white/70">
                      Sign out from your current session
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowLogoutDialog(true)}
                    variant="outline"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 bg-transparent"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-red-500/20">
                  <div>
                    <p className="text-white font-medium">Delete Account</p>
                    <p className="text-sm text-white/70">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="outline"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 bg-transparent"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Change Password</DialogTitle>
            <DialogDescription className="text-white/70">
              Enter your new password below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {passwordErrors.length > 0 && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-white/90">
                  <ul className="list-disc list-inside">
                    {passwordErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="bg-white/5 border-white/20 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 to h-full px-3 text-white/70 hover:text-white hover:bg-transparent"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                >
                  {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="bg-white/5 border-white/20 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 to h-full px-3 text-white/70 hover:text-white hover:bg-transparent"
                  onClick={() =>
                    setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                  }
                >
                  {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordData({ newPassword: "", confirmPassword: "" });
                setPasswordErrors([]);
              }}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={loading.settings}
              className="bg-[#70b340] hover:bg-[#5a9235] text-white"
            >
              {loading.settings ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Picture Dialog */}
      <Dialog open={showPictureDialog} onOpenChange={setShowPictureDialog}>
        <DialogContent className="bg-[#1a2951] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Update Profile Picture</DialogTitle>
            <DialogDescription className="text-white/70">
              Upload a new profile picture
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {picturePreview ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Avatar className="h-32 w-32 border-4 border-white/20">
                    <AvatarImage src={picturePreview} alt="Preview" />
                  </Avatar>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPicture(null);
                    setpicturePreview("");
                  }}
                  className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <X className="h-4 w-4 mr-2" />
                  Choose Different Picture
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors">
                <input
                  type="file"
                  id="picture-upload"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handlePictureSelect}
                />
                <label htmlFor="picture-upload" className="cursor-pointer">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-white/50" />
                  <p className="text-white font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-white/50 text-sm">JPG, PNG or WebP (max 5MB)</p>
                </label>
              </div>
            )}

            {loading.upload && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Uploading...</span>
                  <span className="text-white font-medium">{uploadProgress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#70b340] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPictureDialog(false);
                setSelectedPicture(null);
                setpicturePreview("");
              }}
              disabled={loading.upload}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePictureUpload}
              disabled={!selectedPicture || loading.upload}
              className="bg-[#70b340] hover:bg-[#5a9235] text-white"
            >
              {loading.upload ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Upload Picture
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-[#1a2951] border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Sign Out?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to sign out from your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white bg-transparent hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1a2951] border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. This will permanently delete your account and
              remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white bg-transparent hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.error("Account deletion is not available yet. Please contact support.");
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}