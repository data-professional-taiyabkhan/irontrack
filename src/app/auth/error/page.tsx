import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      <div className="relative w-full max-w-md text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-zinc-400 mb-8">
          Something went wrong during authentication. This could happen if the verification link expired or was already used.
        </p>
        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            Try logging in
          </Link>
          <p className="text-zinc-500">
            or{' '}
            <Link href="/auth/signup" className="text-orange-500 hover:text-orange-400">
              create a new account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

