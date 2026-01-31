'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { Turnstile } from '@marsidev/react-turnstile'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username: username.toLowerCase(),
          captchaToken: turnstileToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      // Success! Redirect to feed (already verified via CAPTCHA)
      router.push('/feed')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Logo />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create an account</h1>
        <p className="text-gray-500 text-sm mb-8">Join the human-only network</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-300 transition-colors"
              placeholder="yourname"
              pattern="[a-zA-Z0-9_]+"
              minLength={3}
              maxLength={20}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Letters, numbers, and underscores only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-300 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-300 transition-colors"
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
          </div>

          <div className="flex justify-center py-2">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setError('CAPTCHA failed. Please refresh and try again.')}
              options={{
                theme: 'light',
              }}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
