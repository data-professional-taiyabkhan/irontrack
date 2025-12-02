import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'

interface MonthGroup {
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessions: any[]
}

export default async function HistoryPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch all sessions with exercises
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      session_exercises (
        exercise:exercises (name)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('date', { ascending: false })

  const dayTypeLabels: Record<string, string> = {
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
    other: 'Other',
  }

  const dayTypeColors: Record<string, string> = {
    push: 'bg-blue-500/20 text-blue-400',
    pull: 'bg-green-500/20 text-green-400',
    legs: 'bg-purple-500/20 text-purple-400',
    other: 'bg-zinc-700 text-zinc-300',
  }

  // Group sessions by month
  const sessionsByMonth: Record<string, MonthGroup> = {}
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessions?.forEach((session: any) => {
    const date = new Date(session.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    if (!sessionsByMonth[monthKey]) {
      sessionsByMonth[monthKey] = { label: monthLabel, sessions: [] }
    }
    sessionsByMonth[monthKey].sessions.push(session)
  })

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar isAuthenticated={true} />
      
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Workout History</h1>
              <p className="text-zinc-400">
                {sessions?.length || 0} workout{sessions?.length !== 1 ? 's' : ''} logged
              </p>
            </div>
            <Link
              href="/workouts/new"
              className="px-4 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Workout
            </Link>
          </div>

          {/* Sessions List */}
          {sessions && sessions.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(sessionsByMonth).map(([monthKey, monthData]) => (
                <div key={monthKey}>
                  <h2 className="text-lg font-semibold text-zinc-400 mb-4">{monthData.label}</h2>
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {monthData.sessions.map((session: any) => {
                      const exerciseNames = session.session_exercises
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ?.map((se: any) => se.exercise?.name)
                        .filter(Boolean) || []

                      return (
                        <Link
                          key={session.id}
                          href={`/workouts/${session.id}`}
                          className="block p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:border-zinc-700/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${dayTypeColors[session.day_type]}`}>
                                  {session.day_type_label || dayTypeLabels[session.day_type]}
                                </span>
                                <span className="text-zinc-400">
                                  {new Date(session.date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{(session.total_volume || 0).toLocaleString()} lbs</div>
                              <div className="text-sm text-zinc-500">{session.session_exercises?.length || 0} exercises</div>
                            </div>
                          </div>
                          <div className="text-sm text-zinc-500">
                            {exerciseNames.slice(0, 4).join(', ')}
                            {exerciseNames.length > 4 && ` +${exerciseNames.length - 4} more`}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">No workout history yet</h2>
              <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
                Start logging your workouts to build your training history and track progress over time.
              </p>
              <Link
                href="/workouts/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Log Your First Workout
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
