'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Avatar from './Avatar'
import Logo from './Logo'

export default function PageNav() {
  const { user, loading } = useAuth()

  return (
    <header className="flex justify-between items-center mb-12">
      <Logo />
      
      {loading ? (
        <div className="w-8 h-8" />
      ) : user ? (
        <div className="flex items-center gap-3">
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
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Log in
          </Link>
          <Link 
            href="/signup"
            className="text-sm font-medium px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Get started
          </Link>
        </div>
      )}
    </header>
  )
}
