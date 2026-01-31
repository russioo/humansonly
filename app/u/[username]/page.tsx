'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import Logo from '@/components/Logo'
import type { Profile, Post, Community } from '@/lib/types'

type PostWithCommunity = Post & {
  community: Community
}

function formatNumber(num: number) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostWithCommunity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [username])

  async function loadProfile() {
    // Check if current user is logged in
    const res = await fetch('/api/auth/me')
    const { user } = await res.json()
    if (user) setCurrentUser(user.id)

    // Get profile by username
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (profileData) {
      setProfile(profileData)

      // Get user's posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          community:communities!posts_community_id_fkey(*)
        `)
        .eq('author_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsData) setPosts(postsData)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">User not found</h1>
          <p className="text-gray-500 mb-4">u/{username} does not exist</p>
          <Link href="/feed" className="text-rose-500 hover:underline">Back to feed</Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser === profile.id

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-gradient-to-b from-rose-50 to-rose-50/80 backdrop-blur-sm border-b border-rose-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <Logo />
          
          <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900">
            Back to feed
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white/70 border border-rose-100/50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <Avatar 
              src={profile.avatar_url} 
              name={profile.display_name || profile.username}
              size="lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-gray-900">
                  {profile.display_name || profile.username}
                </h1>
                {profile.is_verified_human && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                    Verified Human
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-3">u/{profile.username}</p>
              
              {profile.bio && (
                <p className="text-gray-600 text-sm mb-4">{profile.bio}</p>
              )}

              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">{formatNumber(profile.karma || 0)}</span>
                  <span className="text-gray-400 ml-1">karma</span>
                </div>
                <div className="text-gray-400">
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <Link 
                href="/profile"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Karma Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/70 border border-rose-100/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{formatNumber(profile.post_karma || 0)}</p>
            <p className="text-xs text-gray-400">Post Karma</p>
          </div>
          <div className="bg-white/70 border border-rose-100/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{formatNumber(profile.comment_karma || 0)}</p>
            <p className="text-xs text-gray-400">Comment Karma</p>
          </div>
        </div>

        {/* Posts */}
        <div className="bg-white/70 border border-rose-100/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-100/50">
            <h2 className="font-semibold text-gray-900">Posts</h2>
          </div>

          {posts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No posts yet
            </div>
          ) : (
            <div className="divide-y divide-rose-100/50">
              {posts.map((post) => (
                <Link 
                  key={post.id} 
                  href={`/post/${post.id}`}
                  className="block p-5 hover:bg-rose-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span className="font-medium text-rose-500">h/{post.community?.slug}</span>
                    <span>·</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{post.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{formatNumber(post.upvotes - post.downvotes)} points</span>
                    <span>{post.comment_count} comments</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
