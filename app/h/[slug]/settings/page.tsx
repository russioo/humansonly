'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import type { Community, Profile, CommunityMember } from '@/lib/types'

type MemberWithProfile = CommunityMember & {
  profile: Profile
}

export default function CommunitySettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  
  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [user, setUser] = useState<{ id: string; role: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [slug])

  async function loadData() {
    // Get user from custom auth
    const res = await fetch('/api/auth/me')
    const { user: authUser } = await res.json()
    
    if (!authUser) {
      router.push('/login')
      return
    }

    // Get community
    const { data: communityData } = await supabase
      .from('communities')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!communityData) {
      router.push('/communities')
      return
    }

    setCommunity(communityData)
    setDescription(communityData.description || '')

    // Check if user is admin
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('user_id', authUser.id)
      .eq('community_id', communityData.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      router.push(`/h/${slug}`)
      return
    }

    setUser({ id: authUser.id, role: membership.role })

    // Get all members
    const { data: membersData } = await supabase
      .from('community_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('community_id', communityData.id)
      .order('joined_at', { ascending: true })

    if (membersData) {
      setMembers(membersData as MemberWithProfile[])
    }

    setLoading(false)
  }

  async function handleSave() {
    if (!community) return

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('communities')
      .update({ description })
      .eq('id', community.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Settings saved!' })
      setCommunity({ ...community, description })
    }

    setSaving(false)
  }

  async function handleRoleChange(memberId: string, newRole: 'member' | 'moderator' | 'admin') {
    if (!community) return

    const { error } = await supabase
      .from('community_members')
      .update({ role: newRole })
      .eq('user_id', memberId)
      .eq('community_id', community.id)

    if (!error) {
      setMembers(prev => prev.map(m => 
        m.user_id === memberId ? { ...m, role: newRole } : m
      ))
    }
  }

  async function handleKick(memberId: string, username: string) {
    if (!community) return
    if (!confirm(`Are you sure you want to remove u/${username} from this community?`)) return

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('user_id', memberId)
      .eq('community_id', community.id)

    if (!error) {
      setMembers(prev => prev.filter(m => m.user_id !== memberId))
    }
  }

  async function handleBan(memberId: string, username: string) {
    if (!community || !user) return
    
    const reason = prompt(`Why are you banning u/${username}? (optional)`)
    if (reason === null) return // User cancelled

    // First kick them
    await supabase
      .from('community_members')
      .delete()
      .eq('user_id', memberId)
      .eq('community_id', community.id)

    // Then ban them
    await supabase
      .from('community_bans')
      .insert({
        community_id: community.id,
        user_id: memberId,
        banned_by: user.id,
        reason: reason || null,
      })

    setMembers(prev => prev.filter(m => m.user_id !== memberId))
    setMessage({ type: 'success', text: `u/${username} has been banned` })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!community || !user) return null

  return (
    <div className="min-h-screen">
      <nav className="max-w-3xl mx-auto px-4 py-5 flex justify-between items-center">
        <Logo />
        <Link href={`/h/${slug}`} className="text-sm text-gray-600 hover:text-gray-900">
          Back to h/{slug}
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Community Settings</h1>
        <p className="text-gray-500 mb-8">h/{slug}</p>

        {/* Settings */}
        <div className="bg-white/70 border border-rose-100/50 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">General</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-lg text-sm focus:outline-none focus:border-rose-300 resize-none"
                rows={3}
                maxLength={300}
              />
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
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white/70 border border-rose-100/50 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Members ({members.length})</h2>
          
          <div className="space-y-2">
            {members.map((member) => (
              <div 
                key={member.user_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-sm font-bold">
                    {(member.profile?.display_name || member.profile?.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      u/{member.profile?.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {member.role === 'admin' && '👑 Admin'}
                      {member.role === 'moderator' && '🛡️ Moderator'}
                      {member.role === 'member' && 'Member'}
                    </p>
                  </div>
                </div>

                {member.user_id !== user.id && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.user_id, e.target.value as 'member' | 'moderator' | 'admin')}
                      className="text-xs bg-white border border-gray-200 rounded px-2 py-1"
                    >
                      <option value="member">Member</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleKick(member.user_id, member.profile?.username || 'user')}
                      className="text-xs text-gray-500 hover:text-red-500 px-2 py-1"
                    >
                      Kick
                    </button>
                    <button
                      onClick={() => handleBan(member.user_id, member.profile?.username || 'user')}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                    >
                      Ban
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
