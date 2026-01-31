'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const { user, loading: authLoading, logout, refresh } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
    if (user) {
      setDisplayName(user.display_name || '')
      setBio(user.bio || '')
    }
  }, [user, authLoading, router])

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        bio: bio || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save changes' })
    } else {
      setMessage({ type: 'success', text: 'Profile updated!' })
      refresh()
    }
    
    setSaving(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`

    setUploading(true)
    setMessage(null)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setMessage({ type: 'error', text: 'Failed to upload image' })
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl + '?t=' + Date.now() })
      .eq('id', user.id)

    if (updateError) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } else {
      setMessage({ type: 'success', text: 'Avatar updated!' })
      refresh()
    }

    setUploading(false)
  }

  const handleSignOut = async () => {
    await logout()
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
          Back to feed
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Profile Settings</h1>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-rose-100 p-6 mb-6">
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-rose-100">
            <div className="relative">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center text-3xl font-bold text-rose-600">
                  {(displayName || user.username || '?')[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="text-xs">...</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">{displayName || user.username}</p>
              <p className="text-sm text-gray-400">@{user.username}</p>
              {user.is_verified_human && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                  Verified Human
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-300 transition-colors"
                placeholder="How should we call you?"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-300 transition-colors resize-none"
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-400 mt-1">{bio.length}/200</p>
            </div>

            {message && (
              <div className={`text-sm px-4 py-3 rounded-lg ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Karma Stats */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-rose-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Karma</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-rose-50 rounded-xl">
              <p className="text-3xl font-bold text-rose-600">{user.karma || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total Karma</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-700">{user.post_karma || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Post Karma</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-700">{user.comment_karma || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Comment Karma</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Karma is earned when others upvote your posts and comments
          </p>
        </div>

        {/* Account */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-rose-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Member since</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(user.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
