'use client'

interface RPEInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

const RPE_SCALE = [
  { value: 10, reps: 0, description: 'Maximum effort - could not do any more reps' },
  { value: 9, reps: 1, description: 'Very hard - could do 1 more rep' },
  { value: 8, reps: 2, description: 'Hard - could do 2 more reps' },
  { value: 7, reps: '3-4', description: 'Challenging - could do 3-4 more reps' },
  { value: 6, reps: '5+', description: 'Moderate - could do 5+ more reps' },
]

export default function RPEInfoModal({ isOpen, onClose }: RPEInfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">What is RPE?</h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-zinc-400 mb-6">
            <strong className="text-white">RPE (Rating of Perceived Exertion)</strong> is a way to measure how hard a set felt, based on how many reps you had &quot;left in the tank&quot;.
          </p>

          <div className="space-y-3">
            {RPE_SCALE.map((item) => (
              <div
                key={item.value}
                className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/50"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                  item.value === 10 ? 'bg-red-500/20 text-red-400' :
                  item.value === 9 ? 'bg-orange-500/20 text-orange-400' :
                  item.value === 8 ? 'bg-yellow-500/20 text-yellow-400' :
                  item.value === 7 ? 'bg-green-500/20 text-green-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.value}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">
                      {item.reps} rep{item.reps !== 1 && item.reps !== 0 ? 's' : ''} left
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500">{item.description}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-zinc-500">
            💡 Tip: RPE is optional! Use it to track intensity and help plan progressive overload.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}

