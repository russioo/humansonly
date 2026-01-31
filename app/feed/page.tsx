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

export default function FeedPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [user, setUser] = useState<Profile | null>(null)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
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

      const { data: userVotes } = await supabase
        .from('post_votes')
        .select('post_id, vote_type')
        .eq('user_id', authUser.id)

      if (userVotes) {
        const voteMap: Record<string, number> = {}
        userVotes.forEach(v => { voteMap[v.post_id] = v.vote_type })
        setVotes(voteMap)
      }
    }

    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(*),
        community:communities!posts_community_id_fkey(*)
      `)
      .order('created_at', { ascending: false })
      .limit(30)

    if (postsData) setPosts(postsData)

    const { data: communitiesData } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })

    if (communitiesData) {
      setCommunities(communitiesData)
      if (communitiesData.length > 0) setSelectedCommunity(communitiesData[0].id)
    }

    setLoading(false)
  }

  async function handleVote(postId: string, voteType: 1 | -1) {
    if (!user) return

    const currentVote = votes[postId]
    
    if (currentVote === voteType) {
      await supabase.from('post_votes').delete().eq('user_id', user.id).eq('post_id', postId)
      setVotes(prev => { const n = { ...prev }; delete n[postId]; return n })
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        upvotes: p.upvotes - (voteType === 1 ? 1 : 0),
        downvotes: p.downvotes - (voteType === -1 ? 1 : 0)
      } : p))
    } else if (currentVote) {
      await supabase.from('post_votes').update({ vote_type: voteType }).eq('user_id', user.id).eq('post_id', postId)
      setVotes(prev => ({ ...prev, [postId]: voteType }))
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        upvotes: p.upvotes + (voteType === 1 ? 1 : -1),
        downvotes: p.downvotes + (voteType === -1 ? 1 : -1)
      } : p))
    } else {
      await supabase.from('post_votes').insert({ user_id: user.id, post_id: postId, vote_type: voteType })
      setVotes(prev => ({ ...prev, [postId]: voteType }))
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        upvotes: p.upvotes + (voteType === 1 ? 1 : 0),
        downvotes: p.downvotes + (voteType === -1 ? 1 : 0)
      } : p))
    }
  }

  async function handlePost() {
    if (!user || !newPostTitle.trim() || !selectedCommunity) {
      setPostError('Please enter a title and select a community')
      return
    }

    setPosting(true)
    setPostError(null)
    
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: newPostTitle.trim(),
        content: newPostContent.trim() || null,
        author_id: user.id,
        community_id: selectedCommunity,
      })
      .select(`
        *,
        author:profiles!posts_author_id_fkey(*),
        community:communities!posts_community_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error('Post error:', error)
      setPostError(error.message)
      setPosting(false)
      return
    }

    if (data) {
      setPosts(prev => [data, ...prev])
      setNewPostTitle('')
      setNewPostContent('')
      setShowPostForm(false)
    }

    setPosting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-gradient-to-b from-rose-50 to-rose-50/80 backdrop-blur-sm border-b border-rose-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Logo />
          
          {user ? (
            <div className="flex items-center gap-3">
              {user.is_verified_human && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                  Verified
                </span>
              )}
              <Link href="/profile">
                <Avatar 
                  src={user.avatar_url} 
                  name={user.display_name || user.username}
                  size="sm"
                />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Log in</Link>
              <Link href="/signup" className="text-sm font-medium px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                Get started
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Create Post */}
            {user && (
              <div className="bg-white/70 border border-rose-100/50 rounded-xl p-4 mb-4">
                {!showPostForm ? (
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="w-full text-left bg-rose-50 rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-rose-100 transition-colors"
                  >
                    Create a post...
                  </button>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedCommunity}
                      onChange={(e) => setSelectedCommunity(e.target.value)}
                      className="text-sm bg-white border border-rose-100 rounded-lg px-3 py-2 focus:outline-none w-full"
                    >
                      <option value="">Select a community</option>
                      {communities.map(c => (
                        <option key={c.id} value={c.id}>h/{c.slug}</option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full bg-white border border-rose-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-rose-300"
                    />
                    
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Text (optional)"
                      className="w-full bg-white border border-rose-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-rose-300 resize-none"
                      rows={4}
                    />

                    {postError && (
                      <p className="text-red-500 text-sm">{postError}</p>
                    )}
                    
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowPostForm(false)
                          setNewPostTitle('')
                          setNewPostContent('')
                          setPostError(null)
                        }}
                        className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePost}
                        disabled={posting || !newPostTitle.trim() || !selectedCommunity}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {posting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Posts */}
            {posts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="mb-2">No posts yet</p>
                <p className="text-sm">Be the first to share something!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white/70 border border-rose-100/50 rounded-xl p-4 hover:border-rose-200 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => user && handleVote(post.id, 1)}
                          disabled={!user}
                          className={`p-1.5 rounded hover:bg-rose-50 transition-colors disabled:opacity-50 ${
                            votes[post.id] === 1 ? 'text-rose-500' : 'text-gray-400'
                          }`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 15l-6-6-6 6"/>
                          </svg>
                        </button>
                        <span className={`text-sm font-semibold ${
                          votes[post.id] === 1 ? 'text-rose-500' : 
                          votes[post.id] === -1 ? 'text-blue-500' : 'text-gray-700'
                        }`}>
                          {formatNumber(post.upvotes - post.downvotes)}
                        </span>
                        <button
                          onClick={() => user && handleVote(post.id, -1)}
                          disabled={!user}
                          className={`p-1.5 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 ${
                            votes[post.id] === -1 ? 'text-blue-500' : 'text-gray-400'
                          }`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                          <Link href={`/h/${post.community?.slug}`} className="font-medium text-rose-500 hover:underline">
                            h/{post.community?.slug}
                          </Link>
                          <span>·</span>
                          <Link href={`/u/${post.author?.username}`} className="hover:underline">u/{post.author?.username}</Link>
                          <span>·</span>
                          <span>{timeAgo(post.created_at)}</span>
                        </div>
                        <Link href={`/post/${post.id}`}>
                          <h2 className="font-medium text-gray-900 hover:text-rose-600 transition-colors">
                            {post.title}
                          </h2>
                        </Link>
                        {post.content && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{post.content}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            {post.comment_count} comments
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Create Community */}
            {user && (
              <Link
                href="/create-community"
                className="block bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 text-white hover:from-rose-600 hover:to-rose-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="16"/>
                      <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Create Community</p>
                    <p className="text-rose-100 text-xs">Start your own h/</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Communities */}
            <div className="bg-white/70 border border-rose-100/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Communities</h3>
              <div className="space-y-2">
                {communities.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href={`/h/${c.slug}`}
                    className="flex items-center gap-3 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold">
                      h/
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.slug}</p>
                      <p className="text-xs text-gray-400">{formatNumber(c.member_count)} members</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/communities" className="block text-center text-xs text-rose-500 font-medium hover:underline mt-3 pt-3 border-t border-rose-100">
                View all communities
              </Link>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-400 space-y-2 px-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link href="/about" className="hover:text-gray-600">About</Link>
                <Link href="/terms" className="hover:text-gray-600">Terms</Link>
                <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
              </div>
              <p>© 2026 humansonly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
