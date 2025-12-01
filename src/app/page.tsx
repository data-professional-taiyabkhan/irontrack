import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Track your workouts.
            <br />
            <span className="gradient-text">See real progress.</span>
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            A minimal workout tracker for lifters who want simplicity over bloat. 
            Log your sessions, compare your lifts, and watch your numbers grow.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-orange-500/25 text-center"
            >
              Start Tracking — Free
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-800/50 text-zinc-300 font-semibold rounded-xl hover:bg-zinc-800 transition-all duration-200 border border-zinc-700/50 text-center"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How it works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Log your sessions',
                description: 'Add exercises, sets, and reps in seconds. Track weight, RPE, and notes for each set.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Compare your lifts',
                description: 'See how you performed vs last time. Track PRs and estimated 1RMs automatically.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Stay consistent',
                description: 'View your workout history, track weekly volume, and build the habit that builds muscle.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="relative p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors group">
                <div className="absolute -top-4 -left-2 text-6xl font-bold text-zinc-800/50 group-hover:text-orange-500/20 transition-colors">
                  {item.step}
                </div>
                <div className="relative">
                  <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-zinc-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built for lifters who
                <span className="gradient-text"> actually lift</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8">
                No influencer features. No complicated meal plans. Just the tools you need to track your workouts and see progress.
              </p>
              <ul className="space-y-4">
                {[
                  'Freestyle your training — no rigid programs required',
                  'See what you lifted last session instantly',
                  'Track estimated 1RMs and volume over time',
                  'Works great on mobile — log between sets',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold gradient-text mb-2">135</div>
                  <div className="text-zinc-400">lbs × 8 reps</div>
                  <div className="text-sm text-zinc-500 mt-4">RPE 8 — 2 reps in reserve</div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 border-t border-zinc-800/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Questions?
          </h2>
          
          <div className="space-y-4">
            {[
              {
                q: 'Is it free?',
                a: 'Yes! IronTrack is completely free to use. We may add premium features later, but core tracking will always be free.',
              },
              {
                q: 'Can I use it on mobile?',
                a: 'Absolutely. IronTrack is built mobile-first. Log your sets right there in the gym between exercises.',
              },
              {
                q: 'How is my data stored?',
                a: 'Your data is securely stored in the cloud and tied to your account. You can export or delete it anytime.',
              },
              {
                q: 'Do I need to follow a specific program?',
                a: 'Nope. IronTrack is designed for freestyle training. Add any exercise, any day. We just help you track it.',
              },
            ].map((faq, i) => (
              <details key={i} className="group p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-semibold text-lg">{faq.q}</span>
                  <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-zinc-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to track your gains?
          </h2>
          <p className="text-zinc-400 text-lg mb-10">
            Join now and start logging your first workout in minutes.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex px-10 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-orange-500/25"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold">IronTrack</span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} IronTrack. Built for lifters.
          </p>
        </div>
      </footer>
    </div>
  )
}
