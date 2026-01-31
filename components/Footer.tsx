import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-12 border-t border-rose-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link href="/" className="text-lg font-semibold text-gray-900">
            humansonly
          </Link>
          <p className="text-sm text-gray-400 mt-1">
            The last AI-free corner of the internet.
          </p>
        </div>
        
        <div className="flex items-center gap-8 text-sm text-gray-500">
          <Link href="/about" className="hover:text-gray-900 transition-colors">About</Link>
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
