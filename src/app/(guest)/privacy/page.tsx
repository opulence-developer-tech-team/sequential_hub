'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Lock, Eye, Mail, Database, Scissors, FileText } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        {/* Header */}
        <header className="mb-8 sm:mb-12 lg:mb-14">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white border-2 border-primary-100 shadow-md flex items-center justify-center overflow-hidden">
              <Image
                src="/icon/sewing-machine.png"
                alt="Sequential Hub Logo"
                width={52}
                height={52}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary-600 mb-1">
                Privacy Policy
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                Your privacy matters to us
              </h1>
              <p className="mt-1 text-sm text-gray-500 max-w-xl">
                We are committed to protecting your personal information and being transparent about how we collect, use, and safeguard your data.
              </p>
            </div>
          </div>

          {/* Last updated notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                <Shield className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary-900">
                  Last Updated
                </p>
                <p className="mt-0.5 text-[11px] text-primary-900/80 leading-relaxed">
                  This privacy policy was last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. We may update this policy from time to time, and significant changes will be communicated to you.
                </p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Content */}
        <div className="space-y-8 sm:space-y-10">
          {/* Section 1 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <FileText className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  1. Introduction
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    Sequential Hub (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our tailoring services.
                  </p>
                  <p>
                    Please read this policy carefully. By using our services, you agree to the collection and use of information in accordance with this policy.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 2 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Database className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  2. Information We Collect
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    <strong className="text-gray-900">Personal Information:</strong> We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Name, email address, phone number, and shipping address</li>
                    <li>Payment information (processed securely through our payment providers)</li>
                    <li>Body measurements for custom tailoring services</li>
                    <li>Order history and preferences</li>
                    <li>Account credentials if you create an account</li>
                    <li>Communications with our customer service team</li>
                  </ul>
                  <p>
                    <strong className="text-gray-900">Automatically Collected Information:</strong> When you visit our website, we automatically collect certain information, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>IP address and browser type</li>
                    <li>Device information and operating system</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring website addresses</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 3 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Eye className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  3. How We Use Your Information
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>We use the information we collect for the following purposes:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-gray-900">Order Processing:</strong> To process and fulfill your orders, including custom tailoring based on your measurements</li>
                    <li><strong className="text-gray-900">Communication:</strong> To send order confirmations, shipping updates, and respond to your inquiries</li>
                    <li><strong className="text-gray-900">Service Improvement:</strong> To improve our website, products, and tailoring services</li>
                    <li><strong className="text-gray-900">Personalization:</strong> To personalize your experience and provide tailored product recommendations</li>
                    <li><strong className="text-gray-900">Marketing:</strong> To send you promotional emails and newsletters (with your consent, which you can withdraw at any time)</li>
                    <li><strong className="text-gray-900">Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
                    <li><strong className="text-gray-900">Account Management:</strong> To manage your account and provide customer support</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 4 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Lock className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  4. Information Sharing and Disclosure
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-gray-900">Service Providers:</strong> With trusted third-party service providers who assist us in operating our website, processing payments, shipping orders, and conducting business (these providers are contractually obligated to protect your information)</li>
                    <li><strong className="text-gray-900">Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                    <li><strong className="text-gray-900">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to you)</li>
                    <li><strong className="text-gray-900">Protection of Rights:</strong> To protect our rights, property, or safety, or that of our customers or others</li>
                    <li><strong className="text-gray-900">With Your Consent:</strong> When you have given us explicit permission to share your information</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 5 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Shield className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  5. Data Security
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Encryption of sensitive data in transit and at rest</li>
                    <li>Secure payment processing through PCI-compliant providers</li>
                    <li>Regular security assessments and updates</li>
                    <li>Limited access to personal information on a need-to-know basis</li>
                    <li>Secure storage of measurement data and order information</li>
                  </ul>
                  <p>
                    However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 6 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Scissors className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  6. Cookies and Tracking Technologies
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. Cookies are small data files stored on your device.
                  </p>
                  <p>
                    <strong className="text-gray-900">Types of Cookies We Use:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-gray-900">Essential Cookies:</strong> Required for the website to function properly</li>
                    <li><strong className="text-gray-900">Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
                    <li><strong className="text-gray-900">Preference Cookies:</strong> Remember your preferences and settings</li>
                    <li><strong className="text-gray-900">Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
                  </ul>
                  <p>
                    You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some features of our website.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 7 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Mail className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  7. Your Rights and Choices
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>You have the following rights regarding your personal information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-gray-900">Access:</strong> Request access to the personal information we hold about you</li>
                    <li><strong className="text-gray-900">Correction:</strong> Request correction of inaccurate or incomplete information</li>
                    <li><strong className="text-gray-900">Deletion:</strong> Request deletion of your personal information (subject to legal and contractual obligations)</li>
                    <li><strong className="text-gray-900">Opt-Out:</strong> Unsubscribe from marketing emails at any time using the link in our emails or by contacting us</li>
                    <li><strong className="text-gray-900">Data Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
                    <li><strong className="text-gray-900">Account Management:</strong> Update your account information and preferences through your account settings</li>
                  </ul>
                  <p>
                    To exercise these rights, please contact us through our{' '}
                    <Link
                      href="/contact"
                      className="text-primary-600 underline-offset-2 hover:underline font-medium"
                    >
                      Contact page
                    </Link>
                    . We will respond to your request within a reasonable timeframe.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 8 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Database className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  8. Data Retention
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
                  </p>
                  <p>
                    <strong className="text-gray-900">Retention Periods:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Order and transaction records: Retained for at least 7 years for accounting and legal purposes</li>
                    <li>Measurement data: Retained to facilitate future orders and improve our tailoring services</li>
                    <li>Account information: Retained while your account is active and for a reasonable period after account closure</li>
                    <li>Marketing preferences: Retained until you opt out or request deletion</li>
                  </ul>
                  <p>
                    When we no longer need your information, we will securely delete or anonymize it.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 9 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Shield className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  9. Children&apos;s Privacy
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will take steps to delete such information.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 10 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Mail className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  10. Changes to This Privacy Policy
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last Updated&quot; date.
                  </p>
                  <p>
                    We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 11 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Mail className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  11. Contact Us
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through our{' '}
                    <Link
                      href="/contact"
                      className="text-primary-600 underline-offset-2 hover:underline font-medium"
                    >
                      Contact page
                    </Link>
                    .
                  </p>
                  <p>
                    We are committed to addressing your privacy concerns and will respond to your inquiries in a timely manner.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          className="mt-10 sm:mt-12 rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-4 shadow-sm"
        >
          <p className="text-xs text-primary-900/80 leading-relaxed text-center">
            Your privacy is important to us. We are committed to protecting your personal information and being transparent about our data practices.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
