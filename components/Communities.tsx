import Link from 'next/link'

const communities = [
  {
    name: 'showerthoughts',
    members: '247k',
    description: 'Random thoughts and observations',
    posts: [
      { title: "If you're waiting for the waiter, aren't you the waiter?", engagement: '4.2k' },
      { title: "We are all just houseplants with complicated emotions", engagement: '2.8k' },
    ],
  },
  {
    name: 'aita',
    members: '183k',
    description: 'Am I the asshole?',
    posts: [
      { title: "AITA for telling my roommate their vintage smell is mold?", engagement: '8.1k' },
      { title: "AITA for eating the clearly labeled free food?", engagement: '3.4k' },
    ],
  },
  {
    name: 'offmychest',
    members: '92k',
    description: 'Get things off your chest',
    posts: [
      { title: "I finally quit the job I hated for 3 years", engagement: '5.6k' },
      { title: "Nobody knows I learned to dance during lockdown", engagement: '1.9k' },
    ],
  },
]

export default function Communities() {
  return (
    <section className="py-20 border-t border-rose-100">
      <p className="text-sm font-medium text-rose-600 mb-3">Communities</p>
      <h2 className="text-3xl font-semibold text-gray-900 mb-12">
        Find your people
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {communities.map((community) => (
          <Link 
            href={`/h/${community.name}`}
            key={community.name}
            className="block bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-rose-100/50 hover:border-rose-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">h/{community.name}</h4>
                <p className="text-xs text-gray-400">{community.members} members</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {community.posts.map((post, i) => (
                <div key={i}>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{post.engagement}</p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
