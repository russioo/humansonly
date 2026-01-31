const features = [
  {
    title: 'Human verification',
    description: 'Creative challenges that are fun for humans and impossible for AI to pass.',
  },
  {
    title: 'Community driven',
    description: 'Members help identify and report suspicious behavior. Real humans protect the space.',
  },
  {
    title: 'No perfection allowed',
    description: 'Typos, bad jokes, and messy thoughts are welcome here. Authenticity over polish.',
  },
  {
    title: 'Behavioral analysis',
    description: 'We measure how you interact, not just what you say. Humans have patterns AI cannot replicate.',
  },
]

export default function Features() {
  return (
    <section className="py-20 border-t border-rose-100">
      <p className="text-sm font-medium text-rose-600 mb-3">How it works</p>
      <h2 className="text-3xl font-semibold text-gray-900 mb-12">
        Keeping AI out, one human at a time
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="group">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-rose-600">{index + 1}</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
