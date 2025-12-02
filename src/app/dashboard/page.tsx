import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get current week's date range
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  // Fetch this week's sessions
  const { data: weekSessions } = await supabase
    .from('sessions')
    .select('*, session_exercises(*, sets(*))')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('date', startOfWeek.toISOString().split('T')[0])
    .lte('date', endOfWeek.toISOString().split('T')[0])

  // Fetch recent sessions (last 5)
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('*, session_exercises(exercise:exercises(name))')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(5)

  // Calculate this week stats
  const weeklyWorkouts = weekSessions?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weeklySets = weekSessions?.reduce((acc: number, session: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return acc + (session.session_exercises?.reduce((seAcc: number, se: any) => {
      return seAcc + (se.sets?.length || 0)
    }, 0) || 0)
  }, 0) || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weeklyVolume = weekSessions?.reduce((acc: number, session: any) => acc + (session.total_volume || 0), 0) || 0

  // Calculate streak (consecutive days with workouts)
  const { data: allSessions } = await supabase
    .from('sessions')
    .select('date')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(30)

  let streak = 0
  if (allSessions && allSessions.length > 0) {
    const today = new Date().toISOString().split('T')[0]
    const dates = [...new Set(allSessions.map(s => s.date))].sort().reverse()
    
    let currentDate = new Date(today)
    for (const dateStr of dates) {
      const sessionDate = new Date(dateStr)
      const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 1) {
        streak++
        currentDate = sessionDate
      } else {
        break
      }
    }
  }

  const dayTypeLabels: Record<string, string> = {
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
    other: 'Other',
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar isAuthenticated={true} />
      
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back! 💪</h1>
            <p className="text-zinc-400">Ready to crush another workout?</p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            <Link
              href="/workouts/new"
              className="p-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl hover:opacity-90 transition-opacity group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Log Workout</h3>
              <p className="text-white/70 text-sm">Start a new training session</p>
            </Link>

            <Link
              href="/history"
              className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl hover:border-zinc-700/50 transition-colors"
            >
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">View History</h3>
              <p className="text-zinc-400 text-sm">Browse past workouts</p>
            </Link>

            <Link
              href="/profile"
              className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl hover:border-zinc-700/50 transition-colors"
            >
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">Profile</h3>
              <p className="text-zinc-400 text-sm">Manage your account</p>
            </Link>
          </div>

          {/* This Week Overview */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">This Week</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Workouts', value: weeklyWorkouts.toString(), icon: '🏋️' },
                { label: 'Total Sets', value: weeklySets.toString(), icon: '📊' },
                { label: 'Volume (lbs)', value: weeklyVolume.toLocaleString(), icon: '💪' },
                { label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: '🔥' },
              ].map((stat) => (
                <div key={stat.label} className="p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-zinc-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Sessions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Sessions</h2>
              {recentSessions && recentSessions.length > 0 && (
                <Link href="/history" className="text-sm text-orange-500 hover:text-orange-400">
                  View all →
                </Link>
              )}
            </div>
            
            {recentSessions && recentSessions.length > 0 ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentSessions.map((session: any) => {
                  const exerciseNames = session.session_exercises
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ?.map((se: any) => se.exercise?.name)
                    .filter(Boolean)
                    .slice(0, 3) || []
                  
                  return (
                    <Link
                      key={session.id}
                      href={`/workouts/${session.id}`}
                      className="block p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:border-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                            session.day_type === 'push' ? 'bg-blue-500/20 text-blue-400' :
                            session.day_type === 'pull' ? 'bg-green-500/20 text-green-400' :
                            session.day_type === 'legs' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-zinc-700 text-zinc-300'
                          }`}>
                            {session.day_type_label || dayTypeLabels[session.day_type]}
                          </span>
                          <span className="text-sm text-zinc-400">
                            {new Date(session.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {(session.total_volume || 0).toLocaleString()} lbs
                        </span>
                      </div>
                      <div className="text-sm text-zinc-500">
                        {exerciseNames.join(', ')}
                        {exerciseNames.length < session.session_exercises?.length && 
                          ` +${session.session_exercises.length - exerciseNames.length} more`
                        }
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No workouts yet</h3>
                <p className="text-zinc-400 mb-6">Log your first workout to start tracking your progress</p>
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
          </section>
        </div>
      </main>
    </div>
  )
}
