'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a2951] to-[#0f172a] py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6 pt-16">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 bg-[#70b340]/20 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#70b340]" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Terms and Conditions</h1>
                <p className="text-white/70 text-sm mt-1">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-8 text-white/80">
              {/* Introduction */}
              <section>
                <p className="leading-relaxed">
                  Welcome to Adams Pay. By accessing or using our money transfer and currency exchange platform, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
                </p>
              </section>

              {/* Agreement to Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-[#70b340]" />
                  1. Agreement to Terms
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    By creating an account and using Adams Pay, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.
                  </p>
                  <p>
                    If you do not agree with any part of these terms, you must not use our services.
                  </p>
                </div>
              </section>

              {/* Eligibility */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>To use Adams Pay, you must:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Be at least 18 years of age</li>
                    <li>Have the legal capacity to enter into binding contracts</li>
                    <li>Provide accurate and complete registration information</li>
                    <li>Not be prohibited from using our services under applicable laws</li>
                  </ul>
                </div>
              </section>

              {/* Account Registration */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration and Security</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>When creating an account with Adams Pay:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You must provide accurate, current, and complete information</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You agree to notify us immediately of any unauthorized access or security breach</li>
                    <li>You are responsible for all activities that occur under your account</li>
                    <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
                  </ul>
                </div>
              </section>

              {/* Services */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Our Services</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>Adams Pay provides the following services:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Currency Exchange:</strong> Exchange between supported currencies at current exchange rates</li>
                    <li><strong>Money Transfers:</strong> Send money to recipients using their banking details</li>
                    <li><strong>Adam Points Rewards:</strong> Earn rewards points for transactions that can be used for discounts</li>
                    <li><strong>Referral Program:</strong> Refer friends and earn Adam Points</li>
                  </ul>
                </div>
              </section>

              {/* Transaction Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Transaction Terms</h2>
                <div className="space-y-3 leading-relaxed">
                  <p><strong>5.1 Transaction Processing:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All transactions are subject to verification and approval</li>
                    <li>Exchange rates are determined at the time of transaction initiation</li>
                    <li>Transactions expire after 30 minutes (or as specified) if not completed</li>
                    <li>You must upload valid payment receipts for transaction processing</li>
                  </ul>
                  
                  <p><strong>5.2 Transaction Limits:</strong></p>
                  <p>We may impose limits on transaction amounts, frequency, and volume at our discretion.</p>
                  
                  <p><strong>5.3 Cancellation and Refunds:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Pending transactions can be cancelled before processing</li>
                    <li>Processed transactions may be refunded at our discretion</li>
                    <li>Refunds will be processed using the original payment method when possible</li>
                  </ul>
                </div>
              </section>

              {/* Adam Points */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Adam Points Program</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>Adam Points are reward points earned through transactions and referrals:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Points are awarded based on transaction amounts in USD equivalent</li>
                    <li>50 Adam Points = $1 USD discount on future transactions</li>
                    <li>Points have no cash value and cannot be transferred</li>
                    <li>We reserve the right to modify the points program at any time</li>
                    <li>Points may expire or be forfeited due to account inactivity or violations</li>
                  </ul>
                </div>
              </section>

              {/* Prohibited Activities */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                  7. Prohibited Activities
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>You agree not to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Use our services for any illegal or unauthorized purpose</li>
                    <li>Engage in money laundering, fraud, or other financial crimes</li>
                    <li>Provide false, inaccurate, or misleading information</li>
                    <li>Upload fraudulent or tampered receipts or documents</li>
                    <li>Attempt to manipulate exchange rates or exploit system vulnerabilities</li>
                    <li>Create multiple accounts to abuse referral or rewards programs</li>
                    <li>Interfere with the proper functioning of our platform</li>
                    <li>Violate any applicable laws, regulations, or third-party rights</li>
                  </ul>
                </div>
              </section>

              {/* Fees and Charges */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Fees and Charges</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    Adams Pay may charge fees for certain services. All applicable fees will be clearly displayed before you complete a transaction. We reserve the right to modify our fee structure with prior notice.
                  </p>
                </div>
              </section>

              {/* Liability and Disclaimers */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-[#70b340]" />
                  9. Liability and Disclaimers
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    Adams Pay provides services "as is" without warranties of any kind. We are not liable for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Exchange rate fluctuations or market changes</li>
                    <li>Delays or failures in transaction processing due to circumstances beyond our control</li>
                    <li>Losses resulting from unauthorized access to your account</li>
                    <li>Actions of third-party payment processors or banks</li>
                    <li>Technical issues, system maintenance, or service interruptions</li>
                  </ul>
                  <p className="mt-4">
                    Our total liability for any claim arising from your use of our services shall not exceed the amount of fees paid by you in the 12 months preceding the claim.
                  </p>
                </div>
              </section>

              {/* Privacy and Data */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. Privacy and Data Protection</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    Your use of Adams Pay is also governed by our Privacy Policy. We collect, use, and protect your personal information as described in that policy. By using our services, you consent to such processing.
                  </p>
                </div>
              </section>

              {/* Modifications */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">11. Modifications to Terms</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    We reserve the right to modify these Terms and Conditions at any time. We will notify users of material changes via email or platform notification. Your continued use of Adams Pay after such modifications constitutes acceptance of the updated terms.
                  </p>
                </div>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">12. Account Termination</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    We may suspend or terminate your account at any time for violations of these terms, suspicious activity, or at our discretion. You may close your account at any time by contacting our support team.
                  </p>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">13. Governing Law</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    These Terms and Conditions shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms shall be resolved through binding arbitration.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section className="border-t border-white/20 pt-8">
                <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Information</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    If you have any questions about these Terms and Conditions, please contact us through our support channels or visit our website.
                  </p>
                  <p className="text-white/60 text-sm mt-6">
                    By using Adams Pay, you acknowledge that you have read and understood these Terms and Conditions and agree to be bound by them.
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}