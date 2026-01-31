'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Avatar from './Avatar'
import Logo from './Logo'

export default function PageNav() {
  const { user, loading } = useAuth()

  return (
    <header className="flex justify-between items-center mb-12">
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
      </div>
      
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
