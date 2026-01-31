'use client'

import Link from 'next/link'
import PageNav from '@/components/PageNav'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageNav />

        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: January 2026</p>
          
          <p className="text-gray-600 leading-relaxed mb-6">
            Your privacy matters to us. This policy explains what data we collect and how we use it.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">What we collect</h2>
          <ul className="text-gray-600 space-y-2 mb-6">
            <li><strong>Account information.</strong> Email address and username when you sign up.</li>
            <li><strong>Content you create.</strong> Posts, comments, and votes you make on the platform.</li>
            <li><strong>Verification data.</strong> Response times and patterns during human verification (not stored long-term).</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">What we do not collect</h2>
          <ul className="text-gray-600 space-y-2 mb-6">
            <li>We do not use tracking cookies</li>
            <li>We do not sell your data to third parties</li>
            <li>We do not use your data for advertising</li>
            <li>We do not use third-party analytics</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How we use your data</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We use your data solely to provide the service. Your email is used for account 
            recovery and important notifications. Your content is displayed on the platform 
            as you intend it to be.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Data storage</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Your data is stored securely using Supabase, which provides encrypted storage 
            and secure authentication. We retain your data as long as you have an account.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Your rights</h2>
          <ul className="text-gray-600 space-y-2 mb-6">
            <li>You can delete your account at any time</li>
            <li>You can request a copy of your data</li>
            <li>You can edit or delete your content</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            Privacy questions? Email us at <a href="mailto:privacy@humansonly.fun" className="text-rose-600 hover:underline">privacy@humansonly.fun</a>
          </p>
        </article>

        <footer className="mt-16 pt-8 border-t border-rose-100">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <Link href="/about" className="hover:text-gray-900">About</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
