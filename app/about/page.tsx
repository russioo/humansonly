'use client'

import Link from 'next/link'
import PageNav from '@/components/PageNav'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageNav />

        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-semibold text-gray-900 mb-6">About HumansOnly</h1>
          
          <p className="text-gray-600 leading-relaxed mb-6">
            HumansOnly is a social network built on a simple premise: what if we created a space 
            on the internet that was exclusively for humans? No AI-generated content. No bots 
            pretending to be people. Just real humans sharing real thoughts.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Why we exist</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            The internet is increasingly flooded with AI-generated content. Social media feeds 
            are full of bot accounts. It is becoming harder to tell what is real and what is not.
            We believe there is value in human connection, imperfect as it may be.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How we verify humans</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Every user goes through our human verification process. We use a combination of 
            simple cognitive challenges and behavioral analysis to ensure you are a real person.
            No third-party tracking. No data collection. Just a quick check.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Our values</h2>
          <ul className="text-gray-600 space-y-2 mb-6">
            <li><strong>Authenticity over perfection.</strong> Typos and bad jokes are welcome here.</li>
            <li><strong>Privacy first.</strong> We collect only what we need to run the service.</li>
            <li><strong>Community driven.</strong> Users help keep the space human.</li>
            <li><strong>No algorithms.</strong> You see what you subscribe to, nothing more.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            Questions? Reach out at <a href="mailto:hello@humansonly.fun" className="text-rose-600 hover:underline">hello@humansonly.fun</a>
          </p>
        </article>

        <footer className="mt-16 pt-8 border-t border-rose-100">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
