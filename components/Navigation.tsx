'use client'

import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="py-6 flex justify-between items-center">
      <Link href="/" className="text-xl font-semibold tracking-tight text-gray-900">
        humansonly
      </Link>
      
      <div className="flex items-center gap-6">
        <Link 
          href="/login"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Log in
        </Link>
        <Link 
          href="/signup"
          className="text-sm font-medium px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Get started
        </Link>
      </div>
    </nav>
  )
}
