"use client";

import React, { useEffect, useState } from "react";
import {
  Copy,
  Check,
  Share2,
  Mail,
  MessageCircle,
  Users,
  Gift,
  TrendingUp,
  Zap,
  RefreshCcw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import useData from "@/hooks/useData";

export default function ReferralsPage() {
  const { user } = useAuth();

  const {
    fetchReferralStats,
    referrals,
    referralStats,
    loading,
    error,
    clearReferralsError,
  } = useData();

  // State
  const [copied, setCopied] = useState(false);

  // Load referral data on mount
  useEffect(() => {
    if (user?.id) {
      loadReferralData();
    }
  }, [user?.id]);

  const loadReferralData = async () => {
    if (!user?.id) return;

    try {
      await Promise.all([
        fetchReferralStats(user.id),
      ]);
    } catch (err) {
      console.error("Error loading referral data:", err);
      toast.error("Failed to load referral data");
    }
  };

  const handleRefresh = () => {
    clearReferralsError();
    loadReferralData();
  };

  const handleCopyReferralCode = () => {
    if (!user?.referralCode) return;
    
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };


  const handleShareEmail = () => {
    const subject = "Join Adams Pay - Fast & Secure Money Transfers";
    const body = `Hi! I've been using Adams Pay for money transfers and it's amazing. Join using my referral code ${user?.referralCode} `;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShareWhatsApp = () => {
    const text = `Hi! Join Adams Pay for fast & secure money transfers. Use my referral code ${user?.referralCode} `;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `I'm using @AdamsPay for money transfers. Join me and get rewards! Use code ${user?.referralCode}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };


  // Loading state
  if (loading.referrals && referrals.length === 0) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-[#101d42] via-[#1a2951] to-[#0f1a3a] pt-32">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#70b340]" />
              <p className="text-lg font-medium text-white">Loading Referral Data</p>
              <p className="text-sm text-white/70 mt-1">
                Please wait while we fetch your referral information...
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
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Gift className="h-8 w-8 text-[#70b340]" />
              Referral Program
            </h1>
            <p className="text-white/70 mt-1">
              Share Adams Pay and earn rewards for every friend you refer
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading.referrals}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent self-start sm:self-auto"
          >
            <RefreshCcw
              className={`h-4 w-4 mr-2 ${loading.referrals ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Card className="bg-gradient-to-br from-[#70b340]/20 to-[#5a9235]/20 backdrop-blur-xl border-[#70b340]/30 hover:scale-[1.02] transition-transform p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Adam Points
                  </p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {referralStats?.adamPoints || 0}
                  </p>
                </div>
                <div className="h-16 w-16 bg-[#70b340]/30 rounded-2xl flex items-center justify-center">
                  <Award className="h-8 w-8 text-[#70b340]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border-blue-500/30 hover:scale-[1.02] transition-transform p-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Referrals
                  </p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {referralStats?.totalReferrals || 0}
                  </p>
                </div>
                <div className="h-16 w-16 bg-blue-500/30 rounded-2xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border-purple-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Gift className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Your Referral Code</CardTitle>
                <CardDescription className="text-white/70">
                  Share this code with friends and family
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 bg-white/5 border border-white/20 rounded-lg p-4 flex items-center justify-between">
                <span className="text-3xl font-bold text-white tracking-wider font-mono">
                  {user?.referralCode || "Loading..."}
                </span>
                <Button
                  onClick={handleCopyReferralCode}
                  size="sm"
                  className="bg-[#70b340] hover:bg-[#5a9235] text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator className="bg-white/10" />


            <Separator className="bg-white/10" />

            <div className="space-y-3">
              <p className="text-white/90 text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share via
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleShareEmail}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  onClick={handleShareTwitter}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 ">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <Zap className="h-6 w-6 text-[#70b340]" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold text-lg">1. Share Your Code</h3>
                <p className="text-white/70 text-sm">
                  Share your unique referral code or link with friends, family, and colleagues.
                </p>
              </div>

              <div className="space-y-3">
                <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-white font-semibold text-lg">2. They Sign Up</h3>
                <p className="text-white/70 text-sm">
                  When they register using your code, they become your referral and start using Adams Pay.
                </p>
              </div>

              <div className="space-y-3">
                <div className="h-12 w-12 bg-[#70b340]/20 rounded-xl flex items-center justify-center">
                  <Gift className="h-6 w-6 text-[#70b340]" />
                </div>
                <h3 className="text-white font-semibold text-lg">3. Earn Rewards</h3>
                <p className="text-white/70 text-sm">
                  Earn Adam Points for each successful referral. More referrals = More rewards! Max of 20 referrals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Error state */}
        {error.referrals && (
          <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-medium text-white">Error loading referrals</h3>
                  <p className="text-sm text-white/70">{error.referrals}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading.referrals}
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}