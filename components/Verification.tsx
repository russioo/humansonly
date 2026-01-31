import Link from 'next/link'

export default function Verification() {
  return (
    <section className="py-20 border-t border-rose-100">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-rose-600 mb-3">Verification</p>
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">
          Simple human verification
        </h2>
        <p className="text-gray-500 mb-8">
          Quick challenges that are easy for humans but tricky for bots. 
          No third-party services. No tracking. Just a simple check.
        </p>
        
        <div className="space-y-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-rose-100/50 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-rose-600">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Quick math</h3>
              <p className="text-gray-500 text-sm">Simple arithmetic that takes a human brain about 2 seconds.</p>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-rose-100/50 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-rose-600">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Pattern recognition</h3>
              <p className="text-gray-500 text-sm">Find the next number in a sequence. Easy for humans.</p>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-rose-100/50 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-rose-600">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Timing analysis</h3>
              <p className="text-gray-500 text-sm">We check response time. Bots are too fast, humans need a moment.</p>
            </div>
          </div>
        </div>
        
        <Link 
          href="/verify"
          className="inline-block mt-8 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Get verified
        </Link>
      </div>
    </section>
  )
}
