'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// POSTS
// ============================================

export async function getPosts(communitySlug?: string, limit = 20) {
  const supabase = await createClient()
  
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles(*),
      community:communities(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (communitySlug) {
    query = query.eq('community.slug', communitySlug)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getPost(postId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(*),
      community:communities(*)
    `)
    .eq('id', postId)
    .single()

  if (error) throw error
  return data
}

export async function createPost(title: string, content: string | null, communityId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      content,
      author_id: user.id,
      community_id: communityId,
    })
    .select()
    .single()

  if (error) throw error
  
  revalidatePath('/feed')
  revalidatePath('/h/[slug]', 'page')
  
  return data
}

export async function votePost(postId: string, voteType: 1 | -1) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('post_votes')
    .select()
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Remove vote
      await supabase
        .from('post_votes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)
    } else {
      // Change vote
      await supabase
        .from('post_votes')
        .update({ vote_type: voteType })
        .eq('user_id', user.id)
        .eq('post_id', postId)
    }
  } else {
    // New vote
    await supabase
      .from('post_votes')
      .insert({
        user_id: user.id,
        post_id: postId,
        vote_type: voteType,
      })
  }

  revalidatePath('/feed')
  revalidatePath('/h/[slug]', 'page')
}

// ============================================
// COMMENTS
// ============================================

export async function getComments(postId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createComment(postId: string, content: string, parentId?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('comments')
    .insert({
      content,
      author_id: user.id,
      post_id: postId,
      parent_id: parentId || null,
    })
    .select()
    .single()

  if (error) throw error
  
  revalidatePath('/post/[id]', 'page')
  
  return data
}

export async function voteComment(commentId: string, voteType: 1 | -1) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existingVote } = await supabase
    .from('comment_votes')
    .select()
    .eq('user_id', user.id)
    .eq('comment_id', commentId)
    .single()

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      await supabase
        .from('comment_votes')
        .delete()
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
    } else {
      await supabase
        .from('comment_votes')
        .update({ vote_type: voteType })
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
    }
  } else {
    await supabase
      .from('comment_votes')
      .insert({
        user_id: user.id,
        comment_id: commentId,
        vote_type: voteType,
      })
  }

  revalidatePath('/post/[id]', 'page')
}

// ============================================
// COMMUNITIES
// ============================================

export async function getCommunities() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false })

  if (error) throw error
  return data
}

export async function getCommunity(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export async function joinCommunity(communityId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('community_members')
    .insert({
      user_id: user.id,
      community_id: communityId,
    })

  if (error && error.code !== '23505') throw error // Ignore duplicate key error
  
  revalidatePath('/communities')
  revalidatePath('/h/[slug]', 'page')
}

export async function leaveCommunity(communityId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('user_id', user.id)
    .eq('community_id', communityId)

  if (error) throw error
  
  revalidatePath('/communities')
  revalidatePath('/h/[slug]', 'page')
}

export async function isMember(communityId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('community_members')
    .select()
    .eq('user_id', user.id)
    .eq('community_id', communityId)
    .single()

  return !!data
}

// ============================================
// PROFILE
// ============================================

export async function getProfile(userId?: string) {
  const supabase = await createClient()
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    userId = user.id
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export async function updateProfile(data: {
  display_name?: string
  bio?: string
  avatar_url?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) throw error
  
  revalidatePath('/profile')
}

export async function setVerifiedHuman(userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified_human: true })
    .eq('id', userId)

  if (error) throw error
}
