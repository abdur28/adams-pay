"use client";

import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  RefreshCcw,
  Save,
  AlertTriangle,
  Loader2,
  Globe,
  Mail,
  Phone,
  Bell,
  Shield,
  DollarSign,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AdminSettings } from "@/types/admin";
import useAdminSettings from "@/hooks/admin/useAdminSettings";

export default function AdminSettingsPage() {
  const {
    fetchSettings,
    updateSettings,
    settings,
    loading,
    error,
    clearError
  } = useAdminSettings();

  // Form state
  const [formData, setFormData] = useState<Partial<AdminSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings when component mounts
  useEffect(() => {
    loadSettings();
  }, []);

  // Update form data when settings change
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const loadSettings = async () => {
    try {
      await fetchSettings();
    } catch (err) {
      console.error("Error loading settings:", err);
      toast.error("Failed to load settings");
    }
  };

  const handleRefresh = () => {
    clearError();
    loadSettings();
    setHasChanges(false);
  };

  const handleChange = (field: keyof AdminSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(formData);
      toast.success("Settings updated successfully");
      setHasChanges(false);
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading && !settings) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-white/70 mt-1">
              Configure Adams Pay system settings
            </p>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
            <p className="text-lg font-medium text-white">Loading Settings</p>
            <p className="text-sm text-white/70 mt-1">
              Please wait while we fetch the settings data...
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
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/70 mt-1">
            Configure Adams Pay system settings
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
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-[#70b340] hover:bg-[#5a9235] text-white"
          >
            {saving ? (
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
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20 p-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="font-medium text-white">Error loading settings</h3>
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

      {/* Site Settings */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#70b340]" />
            <CardTitle className="text-white">Site Settings</CardTitle>
          </div>
          <CardDescription className="text-white/70">
            Basic information about your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
         
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/90 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Site Email
              </Label>
              <Input
                type="email"
                value={formData.siteEmail || ''}
                onChange={(e) => handleChange('siteEmail', e.target.value)}
                placeholder="admin@example.com"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/90 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Site Phone
              </Label>
              <Input
                type="tel"
                value={formData.sitePhone || ''}
                onChange={(e) => handleChange('sitePhone', e.target.value)}
                placeholder="+1234567890"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Transaction Settings */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#70b340]" />
            <CardTitle className="text-white">Transaction Settings</CardTitle>
          </div>
          <CardDescription className="text-white/70">
            Configure transaction limits and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          

          <div className="space-y-2">
            <Label className="text-white/90 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Transaction Expiry Hours
            </Label>
            <Input
              type="number"
              value={formData.transactionExpiryMinutes || ''}
              onChange={(e) => handleChange('transactionExpiryMinutes', parseInt(e.target.value))}
              placeholder="30"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
            <p className="text-xs text-white/60">Hours before pending transactions expire</p>
          </div>

         
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#70b340]" />
            <CardTitle className="text-white">Notification Settings</CardTitle>
          </div>
          <CardDescription className="text-white/70">
            Configure notification channels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white/90">Email Notifications</Label>
              <p className="text-sm text-white/60">Send notifications via email</p>
            </div>
            <Switch
              checked={formData.emailNotifications !== false}
              onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white/90">Push Notifications</Label>
              <p className="text-sm text-white/60">Send browser push notifications</p>
            </div>
            <Switch
              checked={formData.pushNotifications !== false}
              onCheckedChange={(checked) => handleChange('pushNotifications', checked)}
            />
          </div>

        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#70b340]" />
            <CardTitle className="text-white">Social Links</CardTitle>
          </div>
          <CardDescription className="text-white/70">
            Connect your social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/90 flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </Label>
            <Input
              type="url"
              value={formData.socialLinks?.facebook || ''}
              onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
              placeholder="https://facebook.com/yourpage"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/90 flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter
            </Label>
            <Input
              type="url"
              value={formData.socialLinks?.twitter || ''}
              onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
              placeholder="https://twitter.com/yourhandle"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/90 flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </Label>
            <Input
              type="url"
              value={formData.socialLinks?.instagram || ''}
              onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
              placeholder="https://instagram.com/yourprofile"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/90 flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Label>
            <Input
              type="url"
              value={formData.socialLinks?.linkedin || ''}
              onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/yourcompany"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button - Fixed at bottom on mobile */}
      {hasChanges && (
        <Card className="bg-[#70b340]/20 backdrop-blur-xl border-[#70b340]/30 p-0 sticky bottom-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Unsaved Changes</p>
                <p className="text-sm text-white/70">You have unsaved changes</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  className="border-white/20 text-white bg-transparent hover:bg-white/10"
                >
                  Discard
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#70b340] hover:bg-[#5a9235] text-white"
                >
                  {saving ? (
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}