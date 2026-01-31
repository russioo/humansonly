import Link from 'next/link'

export default function Hero() {
  return (
    <section className="pt-24 pb-20 max-w-2xl">
      <p className="text-sm font-medium text-rose-600 mb-4">
        The AI-free social network
      </p>
      
      <h1 className="text-5xl font-semibold text-gray-900 leading-tight mb-6">
        A place for humans.<br />
        Only humans.
      </h1>
      
      <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
        Share thoughts, have conversations, and connect with real people. 
        No bots. No algorithms pushing AI content. Just humans being human.
      </p>
      
      <div className="flex items-center gap-4">
        <Link 
          href="/signup"
          className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Get started
        </Link>
        <Link 
          href="/communities"
          className="px-6 py-3 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
        >
          Explore communities
        </Link>
      </div>
    </section>
  )
}
