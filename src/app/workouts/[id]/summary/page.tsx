import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'

interface WorkoutSummaryPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkoutSummaryPage({ params }: WorkoutSummaryPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch session with exercises and sets
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_exercises (
        *,
        exercise:exercises (*),
        sets (*)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !session) {
    notFound()
  }

  // Calculate stats
  const totalSets = session.session_exercises?.reduce(
    (acc: number, se: { sets: unknown[] }) => acc + (se.sets?.length || 0),
    0
  ) || 0

  const totalVolume = session.total_volume || 0

  const exerciseCount = session.session_exercises?.length || 0

  // Get previous session of same day type for comparison
  const { data: previousSession } = await supabase
    .from('sessions')
    .select('*, session_exercises(*, sets(*))')
    .eq('user_id', user.id)
    .eq('day_type', session.day_type)
    .eq('status', 'completed')
    .lt('date', session.date)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const previousVolume = previousSession?.total_volume || 0
  const volumeDiff = previousSession ? totalVolume - previousVolume : null
  const volumePercentChange = previousSession && previousVolume > 0 
    ? ((totalVolume - previousVolume) / previousVolume * 100).toFixed(1)
    : null

  const dayTypeLabels: Record<string, string> = {
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
    other: session.day_type_label || 'Other',
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar isAuthenticated={true} />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Workout Complete! 🔥</h1>
            <p className="text-zinc-400">
              Great {dayTypeLabels[session.day_type]} session on {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 text-center">
              <div className="text-3xl font-bold gradient-text mb-1">{exerciseCount}</div>
              <div className="text-sm text-zinc-400">Exercises</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 text-center">
              <div className="text-3xl font-bold gradient-text mb-1">{totalSets}</div>
              <div className="text-sm text-zinc-400">Total Sets</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 text-center">
              <div className="text-3xl font-bold gradient-text mb-1">{totalVolume.toLocaleString()}</div>
              <div className="text-sm text-zinc-400">Volume (lbs)</div>
            </div>
          </div>

          {/* Comparison with Previous */}
          {previousSession && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">
                vs Last {dayTypeLabels[session.day_type]} Day
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Volume Change</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${
                      volumeDiff && volumeDiff > 0 ? 'text-green-400' : 
                      volumeDiff && volumeDiff < 0 ? 'text-red-400' : 'text-zinc-400'
                    }`}>
                      {volumeDiff && volumeDiff > 0 ? '+' : ''}{volumeDiff?.toLocaleString() || 0} lbs
                    </span>
                    {volumePercentChange && (
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        parseFloat(volumePercentChange) > 0 ? 'bg-green-500/20 text-green-400' : 
                        parseFloat(volumePercentChange) < 0 ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {parseFloat(volumePercentChange) > 0 ? '+' : ''}{volumePercentChange}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-400 mb-1">Previous</div>
                  <div className="text-zinc-500">{previousVolume.toLocaleString()} lbs</div>
                </div>
              </div>
            </div>
          )}

          {/* First Workout Message */}
          {!previousSession && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 mb-8 text-center">
              <div className="text-2xl mb-2">🎉</div>
              <h3 className="font-semibold text-orange-400 mb-2">Nice, this is your baseline!</h3>
              <p className="text-zinc-400 text-sm">
                Every rep from now on beats &quot;no data&quot;. Keep logging to track your progress.
              </p>
            </div>
          )}

          {/* Exercises Summary */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden mb-8">
            <div className="p-4 border-b border-zinc-800/50">
              <h2 className="font-semibold">Exercises</h2>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {session.session_exercises?.map((se: {
                id: string
                exercise: { name: string } | null
                sets: Array<{ weight: number | null; reps: number | null; est_1rm: number | null }>
              }) => {
                const bestSet = se.sets?.reduce((best: { weight: number | null; reps: number | null } | null, set: { weight: number | null; reps: number | null }) => {
                  if (!best) return set
                  const bestVolume = (best.weight || 0) * (best.reps || 0)
                  const setVolume = (set.weight || 0) * (set.reps || 0)
                  return setVolume > bestVolume ? set : best
                }, null)

                const best1RM = se.sets?.reduce((max: number, set: { est_1rm: number | null }) => 
                  Math.max(max, set.est_1rm || 0), 0)

                return (
                  <div key={se.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{se.exercise?.name}</div>
                      <div className="text-sm text-zinc-400">
                        {se.sets?.length} set{se.sets?.length !== 1 ? 's' : ''}
                        {bestSet && bestSet.weight && ` • Best: ${bestSet.weight} × ${bestSet.reps}`}
                      </div>
                    </div>
                    {best1RM > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-zinc-400">Est. 1RM</div>
                        <div className="font-semibold text-orange-400">{Math.round(best1RM)} lbs</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard"
              className="flex-1 py-4 bg-orange-500 text-white font-semibold rounded-xl text-center hover:bg-orange-600 transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/history"
              className="flex-1 py-4 bg-zinc-800 text-white font-medium rounded-xl text-center hover:bg-zinc-700 transition-colors"
            >
              View History
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

