'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import type { Community, Profile } from '@/lib/types'

function formatNumber(num: number) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Get user from custom auth
    const res = await fetch('/api/auth/me')
    const { user: authUser } = await res.json()
    
    if (authUser) {
      setUser(authUser)
    }

    // Get communities
    const { data } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })

    if (data) setCommunities(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <nav className="max-w-3xl mx-auto px-4 py-5 flex justify-between items-center">
        <Logo />
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900">Feed</Link>
              <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center text-sm font-bold text-rose-600">
                {(user.display_name || user.username || '?')[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Log in</Link>
              <Link href="/signup" className="text-sm font-medium px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Communities</h1>
          <p className="text-gray-500">Find your people. Join the conversation.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No communities yet</p>
            <p className="text-sm text-gray-400">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/h/${community.slug}`}
                className="block bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-rose-100/50 hover:border-rose-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 font-bold">
                      h/
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">h/{community.slug}</h2>
                      <p className="text-sm text-gray-500 mt-1">{community.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <p className="font-medium text-gray-600">{formatNumber(community.member_count)}</p>
                    <p className="text-xs">members</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
