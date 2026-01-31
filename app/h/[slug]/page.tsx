'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

export default function CommunityPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [user, setUser] = useState<Profile | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [slug])

  async function loadData() {
    // Get user from custom auth
    const res = await fetch('/api/auth/me')
    const { user: authUser } = await res.json()
    
    if (authUser) {
      setUser(authUser)
    }

    // Get community
    const { data: communityData } = await supabase
      .from('communities')
      .select('*')
      .eq('slug', slug)
      .single()

    if (communityData) {
      setCommunity(communityData)

      // Check membership
      if (authUser) {
        const { data: membership } = await supabase
          .from('community_members')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('community_id', communityData.id)
          .single()

        setIsMember(!!membership)
        setUserRole(membership?.role || null)

        // Get user's votes
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

      // Get posts for this community
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*),
          community:communities!posts_community_id_fkey(*)
        `)
        .eq('community_id', communityData.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (postsData) setPosts(postsData)
    }

    setLoading(false)
  }

  async function handleJoin() {
    if (!user || !community) return
    
    setJoining(true)

    if (isMember) {
      await supabase
        .from('community_members')
        .delete()
        .eq('user_id', user.id)
        .eq('community_id', community.id)
      
      setIsMember(false)
      setCommunity({ ...community, member_count: community.member_count - 1 })
    } else {
      await supabase
        .from('community_members')
        .insert({ user_id: user.id, community_id: community.id })
      
      setIsMember(true)
      setCommunity({ ...community, member_count: community.member_count + 1 })
    }

    setJoining(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Community not found</h1>
          <p className="text-gray-500 mb-4">This community does not exist.</p>
          <Link href="/communities" className="text-rose-600 hover:underline">
            Browse communities
          </Link>
        </div>
      </div>
    )
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

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Community Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-rose-100/50 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 text-xl font-bold">
                h/
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">h/{community.slug}</h1>
                <p className="text-gray-500 mt-1">{community.description || 'No description'}</p>
                <p className="text-sm text-gray-400 mt-2">{formatNumber(community.member_count)} members</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                {(userRole === 'admin' || userRole === 'moderator') && (
                  <Link
                    href={`/h/${slug}/settings`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Settings"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </Link>
                )}
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isMember 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {joining ? '...' : isMember ? 'Joined' : 'Join'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No posts yet</p>
            <p className="text-sm text-gray-400">Be the first to post in this community!</p>
            {user && (
              <Link href="/feed" className="inline-block mt-4 text-rose-500 text-sm font-medium hover:underline">
                Create a post →
              </Link>
            )}
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
    </div>
  )
}
