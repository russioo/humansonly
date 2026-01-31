'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import Logo from '@/components/Logo'
import type { Post, Profile, Community } from '@/lib/types'

type PostWithRelations = Post & {
  author: Profile
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
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function Home() {
  const [user, setUser] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [stats, setStats] = useState({ users: 0, communities: 0, posts: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Get user from our custom auth
    const res = await fetch('/api/auth/me')
    const { user: authUser } = await res.json()
    
    if (authUser) {
      setUser(authUser)
    }

    // Get stats
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: communityCount } = await supabase
      .from('communities')
      .select('*', { count: 'exact', head: true })

    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    setStats({
      users: userCount || 0,
      communities: communityCount || 0,
      posts: postCount || 0,
    })

    // Get recent posts
    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(*),
        community:communities!posts_community_id_fkey(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (postsData) setPosts(postsData)

    // Get communities
    const { data: communitiesData } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })

    if (communitiesData) setCommunities(communitiesData)

    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Logo />
          <a 
            href="https://x.com/onlyhumanswiki" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-900 transition-colors"
            title="Follow us on X"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <span className="text-[10px] font-medium text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded">beta</span>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.is_verified_human && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                  Verified
                </span>
              )}
              <Link href="/feed" className="text-sm text-gray-600 hover:text-gray-900">
                Feed
              </Link>
              <Link href="/profile">
                <Avatar 
                  src={user.avatar_url} 
                  name={user.display_name || user.username}
                  size="sm"
                />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Log in
              </Link>
              <Link href="/signup" className="text-sm font-medium px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-sm text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"/>
            the AI-free social network
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 leading-[1.1] mb-6">
            A Social Network<br/>for <span className="text-rose-500">Real Humans</span>
          </h1>
          
          <p className="text-lg text-gray-500 mb-8 leading-relaxed">
            Where humans share, discuss, and connect. AI agents not welcome.
          </p>
          
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/feed" className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Go to Feed
              </Link>
            ) : (
              <Link href="/signup" className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Join as Human
              </Link>
            )}
            <Link href="/about" className="px-5 py-3 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors">
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-8 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">{formatNumber(stats.users)}</span>
            <span className="text-sm text-gray-400">verified humans</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">{stats.communities}</span>
            <span className="text-sm text-gray-400">communities</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">{formatNumber(stats.posts)}</span>
            <span className="text-sm text-gray-400">posts</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Posts Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900">Recent Posts</h2>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : posts.length === 0 ? (
              <div className="bg-white/70 border border-rose-100/50 rounded-xl p-8 text-center">
                <p className="text-gray-500 mb-2">No posts yet</p>
                <p className="text-sm text-gray-400">Be the first to share something!</p>
                {user && (
                  <Link href="/feed" className="inline-block mt-4 text-rose-500 text-sm font-medium hover:underline">
                    Create a post →
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <Link 
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="block bg-white/70 backdrop-blur-sm border border-rose-100/50 rounded-xl p-4 hover:border-rose-200 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 text-gray-400 min-w-[40px]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 15l-6-6-6 6"/>
                        </svg>
                        <span className="text-xs font-semibold text-gray-600">{formatNumber(post.upvotes - post.downvotes)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">
                          <span className="text-rose-500 font-medium">h/{post.community?.slug}</span>
                          <span className="mx-1">·</span>
                          <Link href={`/u/${post.author?.username}`} className="hover:underline">u/{post.author?.username}</Link>
                          <span className="mx-1">·</span>
                          {timeAgo(post.created_at)}
                        </p>
                        <h3 className="font-medium text-gray-900 text-sm leading-snug mb-2">{post.title}</h3>
                        <p className="text-xs text-gray-400">{post.comment_count} comments</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            <Link href="/feed" className="block text-center text-sm text-rose-500 font-medium hover:underline py-2">
              View all posts →
            </Link>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Card */}
            {!user?.is_verified_human && (
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-5 text-white">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Human Verification</h3>
                <p className="text-rose-100 text-sm mb-4">Quick verification to prove you are human. No tracking, no data collection.</p>
                <Link href={user ? "/verify" : "/signup"} className="inline-block px-4 py-2 bg-white text-rose-600 text-sm font-medium rounded-lg hover:bg-rose-50 transition-colors">
                  {user ? "Get verified" : "Sign up"}
                </Link>
              </div>
            )}

            {/* Communities */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Communities</h3>
                <Link href="/communities" className="text-xs text-rose-500 font-medium hover:underline">View all</Link>
              </div>
              {loading ? (
                <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
              ) : communities.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">No communities yet</div>
              ) : (
                <div className="space-y-2">
                  {communities.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/h/${c.slug}`}
                      className="flex items-center gap-3 p-3 bg-white/70 border border-rose-100/50 rounded-lg hover:border-rose-200 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold">
                        h/
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.slug}</p>
                        <p className="text-xs text-gray-400">{formatNumber(c.member_count)} members</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* About Card */}
            <div className="bg-white/70 border border-rose-100/50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">About HumansOnly</h3>
              <p className="text-sm text-gray-500 mb-4">
                A social network for humans. They share, discuss, and upvote. AI not welcome.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <Link href="/about" className="hover:text-gray-900">About</Link>
                <Link href="/terms" className="hover:text-gray-900">Terms</Link>
                <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8 border-t border-rose-100 mt-8">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <p>© 2026 humansonly</p>
          <p>Built for humans, by humans</p>
        </div>
      </footer>
    </div>
  )
}
