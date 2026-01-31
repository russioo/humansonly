'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import type { Post, Profile, Community, Comment } from '@/lib/types'

type PostWithRelations = Post & {
  author: Profile
  community: Community
}

type CommentWithAuthor = Comment & {
  author: Profile
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
  return `${days}d ago`
}

export default function PostPage() {
  const params = useParams()
  const postId = params.id as string
  
  const [post, setPost] = useState<PostWithRelations | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [user, setUser] = useState<Profile | null>(null)
  const [vote, setVote] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [commenting, setCommenting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [postId])

  async function loadData() {
    // Get user from custom auth
    const res = await fetch('/api/auth/me')
    const { user: authUser } = await res.json()
    
    if (authUser) {
      setUser(authUser)

      // Get user's vote on this post
      const { data: userVote } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('user_id', authUser.id)
        .eq('post_id', postId)
        .single()

      if (userVote) setVote(userVote.vote_type)
    }

    // Get post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(*),
        community:communities!posts_community_id_fkey(*)
      `)
      .eq('id', postId)
      .single()

    console.log('Post query result:', postData, postError)
    if (postData) setPost(postData)

    // Get comments
    const { data: commentsData } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (commentsData) setComments(commentsData)

    setLoading(false)
  }

  async function handleVote(voteType: 1 | -1) {
    if (!user || !post) return

    if (vote === voteType) {
      // Remove vote
      await supabase.from('post_votes').delete().eq('user_id', user.id).eq('post_id', postId)
      setVote(null)
      setPost({
        ...post,
        upvotes: post.upvotes - (voteType === 1 ? 1 : 0),
        downvotes: post.downvotes - (voteType === -1 ? 1 : 0)
      })
    } else if (vote) {
      // Change vote
      await supabase.from('post_votes').update({ vote_type: voteType }).eq('user_id', user.id).eq('post_id', postId)
      setVote(voteType)
      setPost({
        ...post,
        upvotes: post.upvotes + (voteType === 1 ? 1 : -1),
        downvotes: post.downvotes + (voteType === -1 ? 1 : -1)
      })
    } else {
      // New vote
      await supabase.from('post_votes').insert({ user_id: user.id, post_id: postId, vote_type: voteType })
      setVote(voteType)
      setPost({
        ...post,
        upvotes: post.upvotes + (voteType === 1 ? 1 : 0),
        downvotes: post.downvotes + (voteType === -1 ? 1 : 0)
      })
    }
  }

  async function handleComment() {
    if (!user || !newComment.trim()) return

    setCommenting(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        content: newComment.trim(),
        author_id: user.id,
        post_id: postId,
      })
      .select(`
        *,
        author:profiles!comments_author_id_fkey(*)
      `)
      .single()

    if (!error && data) {
      setComments(prev => [...prev, data])
      setNewComment('')
      if (post) setPost({ ...post, comment_count: post.comment_count + 1 })
    }

    setCommenting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Post not found</h1>
          <Link href="/feed" className="text-rose-500 hover:underline">Back to feed</Link>
        </div>
      </div>
    )
  }

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
        {/* Post */}
        <article className="bg-white/70 border border-rose-100/50 rounded-xl p-5 mb-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => user && handleVote(1)}
                disabled={!user}
                className={`p-2 rounded hover:bg-rose-50 transition-colors disabled:opacity-50 ${
                  vote === 1 ? 'text-rose-500' : 'text-gray-400'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </button>
              <span className={`text-lg font-bold ${
                vote === 1 ? 'text-rose-500' : vote === -1 ? 'text-blue-500' : 'text-gray-700'
              }`}>
                {formatNumber(post.upvotes - post.downvotes)}
              </span>
              <button
                onClick={() => user && handleVote(-1)}
                disabled={!user}
                className={`p-2 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 ${
                  vote === -1 ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Link href={`/h/${post.community?.slug}`} className="font-medium text-rose-500 hover:underline">
                  h/{post.community?.slug}
                </Link>
                <span>·</span>
                <Link href={`/u/${post.author?.username}`} className="hover:underline">u/{post.author?.username}</Link>
                <span>·</span>
                <span>{timeAgo(post.created_at)}</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-3">{post.title}</h1>
              {post.content && (
                <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>
              )}
            </div>
          </div>
        </article>

        {/* Comments */}
        <div className="bg-white/70 border border-rose-100/50 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            {post.comment_count} {post.comment_count === 1 ? 'Comment' : 'Comments'}
          </h2>

          {/* Add Comment */}
          {user ? (
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-rose-50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleComment}
                  disabled={commenting || !newComment.trim()}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {commenting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 text-center py-4 bg-rose-50 rounded-lg">
              <p className="text-sm text-gray-500">
                <Link href="/login" className="text-rose-500 hover:underline">Sign in</Link> to leave a comment
              </p>
            </div>
          )}

          {/* Comment List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-rose-100 pl-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <Link href={`/u/${comment.author?.username}`} className="font-medium text-gray-600 hover:underline">u/{comment.author?.username}</Link>
                    <span>·</span>
                    <span>{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
