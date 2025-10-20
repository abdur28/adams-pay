'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, Users, Globe } from 'lucide-react';

export default function PrivacyPolicy() {
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
                <Shield className="h-6 w-6 text-[#70b340]" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
                <p className="text-white/70 text-sm mt-1">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-8 text-white/80">
              {/* Introduction */}
              <section>
                <p className="leading-relaxed">
                  At Adams Pay, we take your privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our money transfer and currency exchange platform. By using Adams Pay, you consent to the practices described in this policy.
                </p>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Database className="h-6 w-6 text-[#70b340]" />
                  1. Information We Collect
                </h2>
                <div className="space-y-4 leading-relaxed">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">1.1 Personal Information</h3>
                    <p>When you create an account or use our services, we collect:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li><strong>Identity Information:</strong> Full name, email address, phone number</li>
                      <li><strong>Account Information:</strong> Username, password (encrypted), profile picture</li>
                      <li><strong>Verification Information:</strong> Government-issued ID, proof of address (if required)</li>
                      <li><strong>Financial Information:</strong> Bank account details for recipients, transaction history</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">1.2 Transaction Data</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Transaction amounts, currencies, and exchange rates</li>
                      <li>Recipient banking details (name, bank, account number)</li>
                      <li>Payment receipts and supporting documents</li>
                      <li>Transaction status, timestamps, and history</li>
                      <li>Adam Points balance and redemption history</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">1.3 Technical Information</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>IP address, device information, and browser type</li>
                      <li>Operating system and device identifiers</li>
                      <li>Usage data, including pages visited and features used</li>
                      <li>Location data (approximate based on IP address)</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">1.4 Communications</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Customer support inquiries and correspondence</li>
                      <li>Feedback, reviews, and survey responses</li>
                      <li>Marketing preferences and newsletter subscriptions</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">1.5 Referral Information</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Your unique referral code</li>
                      <li>Information about users you've referred</li>
                      <li>Referral rewards and Adam Points earned</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="h-6 w-6 text-[#70b340]" />
                  2. How We Use Your Information
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>We use your information to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Provide Services:</strong> Process transactions, manage accounts, and facilitate money transfers</li>
                    <li><strong>Verify Identity:</strong> Comply with KYC (Know Your Customer) and AML (Anti-Money Laundering) regulations</li>
                    <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security incidents</li>
                    <li><strong>Communication:</strong> Send transaction confirmations, updates, and customer support responses</li>
                    <li><strong>Improve Services:</strong> Analyze usage patterns to enhance user experience and platform functionality</li>
                    <li><strong>Marketing:</strong> Send promotional offers, newsletters, and updates (with your consent)</li>
                    <li><strong>Compliance:</strong> Meet legal and regulatory obligations</li>
                    <li><strong>Rewards:</strong> Administer the Adam Points program and referral system</li>
                  </ul>
                </div>
              </section>

              {/* How We Share Information */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-[#70b340]" />
                  3. How We Share Your Information
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>We may share your information with:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Service Providers:</strong> Third-party companies that help us operate our platform (payment processors, cloud storage, email services)</li>
                    <li><strong>Financial Institutions:</strong> Banks and payment networks to process transactions</li>
                    <li><strong>Legal Authorities:</strong> Government agencies, regulators, and law enforcement when required by law</li>
                    <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or sale of assets</li>
                    <li><strong>With Your Consent:</strong> Other third parties when you explicitly authorize us to do so</li>
                  </ul>
                  <p className="mt-4">
                    We do <strong>not</strong> sell your personal information to third parties for marketing purposes.
                  </p>
                </div>
              </section>

              {/* Data Storage and Security */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="h-6 w-6 text-[#70b340]" />
                  4. Data Storage and Security
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p><strong>4.1 Storage:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>We use Firebase and secure cloud infrastructure to store your data</li>
                    <li>Data is stored in secure data centers with industry-standard protections</li>
                    <li>Files (receipts, profile pictures) are stored in encrypted cloud storage</li>
                  </ul>

                  <p><strong>4.2 Security Measures:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Encryption of data in transit (SSL/TLS) and at rest</li>
                    <li>Secure authentication with password hashing</li>
                    <li>Optional biometric authentication for enhanced security</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Access controls and role-based permissions</li>
                    <li>Automated fraud detection systems</li>
                  </ul>

                  <p className="mt-4">
                    While we implement robust security measures, no system is completely secure. You are responsible for maintaining the confidentiality of your account credentials.
                  </p>
                </div>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>We retain your personal information for as long as necessary to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide our services and maintain your account</li>
                    <li>Comply with legal, regulatory, and tax requirements</li>
                    <li>Resolve disputes and enforce our agreements</li>
                    <li>Prevent fraud and abuse</li>
                  </ul>
                  <p className="mt-4">
                    Transaction records are typically retained for 7 years or as required by applicable financial regulations. When data is no longer needed, we securely delete or anonymize it.
                  </p>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Your Privacy Rights</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and personal data (subject to legal requirements)</li>
                    <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                    <li><strong>Restriction:</strong> Request limitation of processing in certain circumstances</li>
                    <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, contact us through our support channels. We will respond to your request within 30 days.
                  </p>
                </div>
              </section>

              {/* Cookies and Tracking */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="h-6 w-6 text-[#70b340]" />
                  7. Cookies and Tracking Technologies
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Remember your preferences and settings</li>
                    <li>Authenticate your account and maintain sessions</li>
                    <li>Analyze platform usage and improve performance</li>
                    <li>Provide personalized content and features</li>
                    <li>Track referrals and attribute rewards correctly</li>
                  </ul>
                  <p className="mt-4">
                    You can control cookies through your browser settings, but disabling them may affect platform functionality.
                  </p>
                </div>
              </section>

              {/* Notifications */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="h-6 w-6 text-[#70b340]" />
                  8. Communications and Notifications
                </h2>
                <div className="space-y-3 leading-relaxed">
                  <p>We may send you:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Transactional Messages:</strong> Order confirmations, receipts, and account updates (cannot be opted out)</li>
                    <li><strong>Service Updates:</strong> Changes to terms, features, or security alerts</li>
                    <li><strong>Marketing Communications:</strong> Promotional offers, newsletters, and product updates (opt-in or opt-out available)</li>
                  </ul>
                  <p className="mt-4">
                    You can manage your communication preferences in your account settings or by clicking unsubscribe in our emails.
                  </p>
                </div>
              </section>

              {/* Third-Party Links */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Third-Party Services and Links</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
                  </p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    Adams Pay is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it promptly.
                  </p>
                </div>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">11. International Data Transfers</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Privacy Policy</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a notice on our platform. The "Last updated" date at the top indicates when the policy was last revised. Your continued use of Adams Pay after changes constitutes acceptance of the updated policy.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section className="border-t border-white/20 pt-8">
                <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
                <div className="space-y-3 leading-relaxed">
                  <p>
                    If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 mt-4">
                    <p className="font-semibold text-white mb-2">Adams Pay Privacy Team</p>
                    <p>Email: info@adamspay.com</p>
                    <p>Support: Contact us through the platform's support section</p>
                  </div>
                  <p className="text-white/60 text-sm mt-6">
                    By using Adams Pay, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and disclosure of your information as described herein.
                  </p>
                </div>
              </section>

              {/* Quick Summary */}
              <section className="bg-[#70b340]/10 rounded-lg p-6 border border-[#70b340]/20 mt-8">
                <h3 className="text-xl font-semibold text-white mb-3">Privacy at a Glance</h3>
                <ul className="space-y-2 text-white/90">
                  <li>✓ We collect information necessary to provide secure money transfer services</li>
                  <li>✓ Your data is encrypted and stored securely using industry-standard practices</li>
                  <li>✓ We never sell your personal information to third parties</li>
                  <li>✓ You have control over your data and can access, update, or delete it</li>
                  <li>✓ We comply with applicable data protection and financial regulations</li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}