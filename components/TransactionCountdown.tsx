"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/types/exchange";

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const TransactionCountdown = () => {
  const router = useRouter();
  const { pendingTransactions, refetch } = useAuth();
  const [timeRemainingMap, setTimeRemainingMap] = useState<Record<string, TimeRemaining>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  // Calculate time remaining for a transaction
  const calculateTimeRemaining = (expiresAt: any): TimeRemaining => {
    const now = new Date().getTime();
    
    let expiryTime: number;
    if (typeof expiresAt === 'string') {
      expiryTime = new Date(expiresAt).getTime();
    } else if (expiresAt?.toDate) {
      expiryTime = expiresAt.toDate().getTime();
    } else if (expiresAt?.seconds) {
      expiryTime = expiresAt.seconds * 1000;
    } else {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const diff = expiryTime - now;

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isExpired: false };
  };

  // Update countdown every second
  useEffect(() => {
    if (!pendingTransactions || pendingTransactions.length === 0) return;

    const updateCountdowns = () => {
      const newTimeMap: Record<string, TimeRemaining> = {};
      let hasExpired = false;

      pendingTransactions.forEach((transaction) => {
        const timeRemaining = calculateTimeRemaining(transaction.expiresAt);
        newTimeMap[transaction.id] = timeRemaining;
        
        if (timeRemaining.isExpired) {
          hasExpired = true;
        }
      });

      setTimeRemainingMap(newTimeMap);

      // Refetch user to clean up expired transactions
      if (hasExpired) {
        refetch();
      }
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [pendingTransactions, refetch]);

  const handleDismiss = (transactionId: string) => {
    setDismissed((prev) => ({ ...prev, [transactionId]: true }));
  };

  const handleViewTransaction = (transactionId: string) => {
    router.push(`/transaction/${transactionId}`);
  };

  // Filter out dismissed and expired transactions
  const visibleTransactions = pendingTransactions?.filter(
    (transaction) =>
      !dismissed[transaction.id] &&
      !timeRemainingMap[transaction.id]?.isExpired
  ) || [];

  if (visibleTransactions.length === 0) return null;

  return (
    <div className="fixed bottom-10 right-4 z-40 max-w-lg space-y-2">
      <AnimatePresence>
        {visibleTransactions.map((transaction) => {
          const timeRemaining = timeRemainingMap[transaction.id];
          if (!timeRemaining || timeRemaining.isExpired) return null;

          const isUrgent = timeRemaining.hours === 0 && timeRemaining.minutes < 5;

          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={`backdrop-blur-xl border-2 shadow-2xl p-0 ${
                  isUrgent
                    ? "bg-red-500/10 border-red-500/50 animate-pulse"
                    : "bg-white/10 border-white/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Icon and Content */}
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          isUrgent ? "bg-red-500/20" : "bg-[#70b340]/20"
                        }`}
                      >
                        {isUrgent ? (
                          <AlertTriangle
                            className={`h-5 w-5 ${
                              isUrgent ? "text-red-400" : "text-[#70b340]"
                            }`}
                          />
                        ) : (
                          <Clock
                            className={`h-5 w-5 ${
                              isUrgent ? "text-red-400" : "text-[#70b340]"
                            }`}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold text-sm">
                            Pending Transfer
                          </p>
                          <Badge
                            className={`text-xs ${
                              isUrgent
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/20"
                                : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
                            }`}
                          >
                            {isUrgent ? "Urgent" : "Active"}
                          </Badge>
                        </div>

                        <p className="text-white/70 text-xs mb-2">
                          {formatCurrency(
                            transaction.totalFromAmount || transaction.fromAmount,
                            transaction.fromCurrency
                          )}{" "}
                          → {formatCurrency(transaction.toAmount, transaction.toCurrency)}
                        </p>

                        {/* Countdown */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-white/50" />
                            <span className="text-white font-mono text-sm font-semibold">
                              {String(timeRemaining.hours).padStart(2, "0")}:
                              {String(timeRemaining.minutes).padStart(2, "0")}:
                              {String(timeRemaining.seconds).padStart(2, "0")}
                            </span>
                          </div>
                          <span className="text-white/50 text-xs">remaining</span>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleViewTransaction(transaction.id)}
                          size="sm"
                          className={`mt-3 w-full text-xs h-8 ${
                            isUrgent
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-[#70b340] hover:bg-[#5a9235]"
                          } text-white`}
                        >
                          View Transaction
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>

                    {/* Close Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(transaction.id)}
                      className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10 shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default TransactionCountdown;