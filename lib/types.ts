export interface Profile {
  id: string
  username: string
  email: string
  password_hash?: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  is_verified_human: boolean
  karma: number
  post_karma: number
  comment_karma: number
  created_at: string
  updated_at: string
}

export interface Community {
  id: string
  slug: string
  name: string
  description: string | null
  icon_url: string | null
  banner_url: string | null
  created_by: string | null
  member_count: number
  created_at: string
}

export interface Post {
  id: string
  title: string
  content: string | null
  author_id: string
  community_id: string
  upvotes: number
  downvotes: number
  comment_count: number
  created_at: string
  updated_at: string
  // Joined data
  author?: Profile
  community?: Community
  user_vote?: number | null
}

export interface Comment {
  id: string
  content: string
  author_id: string
  post_id: string
  parent_id: string | null
  upvotes: number
  downvotes: number
  created_at: string
  // Joined data
  author?: Profile
  replies?: Comment[]
  user_vote?: number | null
}

export interface PostVote {
  user_id: string
  post_id: string
  vote_type: -1 | 1
  created_at: string
}

export interface CommentVote {
  user_id: string
  comment_id: string
  vote_type: -1 | 1
  created_at: string
}

export interface CommunityMember {
  user_id: string
  community_id: string
  role: 'member' | 'moderator' | 'admin'
  joined_at: string
  // Joined
  profile?: Profile
}

export interface CommunityBan {
  community_id: string
  user_id: string
  banned_by: string
  reason: string | null
  banned_at: string
}
