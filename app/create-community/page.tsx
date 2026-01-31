'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

export default function CreateCommunityPage() {
  const { user, loading: authLoading } = useAuth()
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    // Validate slug
    if (slug.length < 3) {
      setError('Slug must be at least 3 characters')
      return
    }

    if (!/^[a-z0-9_]+$/.test(slug)) {
      setError('Slug can only contain lowercase letters, numbers, and underscores')
      return
    }

    setLoading(true)
    setError(null)

    // Check if slug is taken
    const { data: existing } = await supabase
      .from('communities')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existing) {
      setError('This community name is already taken')
      setLoading(false)
      return
    }

    // Create community
    const { data, error: createError } = await supabase
      .from('communities')
      .insert({
        slug,
        name: name || slug,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      setLoading(false)
      return
    }

    // Add creator as admin member
    if (data) {
      await supabase
        .from('community_members')
        .insert({
          user_id: user.id,
          community_id: data.id,
          role: 'admin',
        })
    }

    router.push(`/h/${slug}`)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen">
      <nav className="max-w-2xl mx-auto px-4 py-5 flex justify-between items-center">
        <Logo />
        <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900">
          Cancel
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create a Community</h1>
        <p className="text-gray-500 mb-8">Build a space for humans to connect around a shared interest.</p>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="bg-white/70 border border-rose-100/50 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Community Name (URL)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">h/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="flex-1 px-4 py-2.5 bg-white border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-300"
                  placeholder="yourcommunity"
                  minLength={3}
                  maxLength={30}
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and underscores only. Cannot be changed later.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-300"
                placeholder="Your Community"
                maxLength={50}
              />
              <p className="text-xs text-gray-400 mt-1">Optional. How the community name appears to users.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-300 resize-none"
                placeholder="What is this community about?"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-gray-400 mt-1">{description.length}/300</p>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
            <p className="text-sm text-rose-800 font-medium mb-1">You will be the admin</p>
            <p className="text-xs text-rose-600">
              As the creator, you can moderate posts, ban users, and appoint other moderators.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !slug.trim()}
            className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  )
}
