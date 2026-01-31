'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import { Turnstile } from '@marsidev/react-turnstile'

export default function VerifyPage() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading, refresh } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleVerify = async () => {
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA')
      return
    }

    setVerifying(true)
    setError(null)

    try {
      // Verify token server-side
      const res = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      })

      const data = await res.json()

      if (!data.success) {
        setError('Verification failed. Please try again.')
        setVerifying(false)
        return
      }

      // Mark user as verified in database
      if (user) {
        await supabase
          .from('profiles')
          .update({ is_verified_human: true })
          .eq('id', user.id)
        refresh()
      }

      setVerified(true)
      setTimeout(() => router.push('/feed'), 1500)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setVerifying(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-12">
          <Logo />
        </div>

        {!verified ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-rose-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Human Verification</p>
                <p className="text-xs text-gray-400">Prove you are not a robot</p>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError('CAPTCHA error. Please refresh and try again.')}
                options={{
                  theme: 'light',
                }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center mb-4">{error}</p>
            )}

            <button
              onClick={handleVerify}
              disabled={verifying || !turnstileToken}
              className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Continue'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              By continuing, you confirm you are a human
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verified</h1>
            <p className="text-gray-500 text-sm">Welcome to HumansOnly</p>
          </div>
        )}
      </div>
    </div>
  )
}
