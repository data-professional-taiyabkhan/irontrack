import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import ExerciseProgressChart from '@/components/analytics/ExerciseProgressChart'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get unique exercises from sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id,
      date,
      session_exercises (
        exercise:exercises (id, name),
        sets (weight, reps, est_1rm)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('date', { ascending: true })

  // Build exercise map with progress data
  const exerciseMap = new Map<string, { id: string; name: string; data: Array<{ date: string; best1rm: number; bestWeight: number; totalVolume: number }> }>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessions?.forEach((session: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session.session_exercises?.forEach((se: any) => {
      const exercise = se.exercise
      if (!exercise) return

      const exerciseId = exercise.id
      if (!exerciseMap.has(exerciseId)) {
        exerciseMap.set(exerciseId, {
          id: exerciseId,
          name: exercise.name,
          data: []
        })
      }

      const exerciseData = exerciseMap.get(exerciseId)!
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const best1rm = se.sets?.reduce((max: number, set: any) => 
        Math.max(max, set.est_1rm || 0), 0) || 0
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bestWeight = se.sets?.reduce((max: number, set: any) => 
        Math.max(max, set.weight || 0), 0) || 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalVolume = se.sets?.reduce((sum: number, set: any) => 
        sum + ((set.weight || 0) * (set.reps || 0)), 0) || 0

      exerciseData.data.push({
        date: session.date,
        best1rm,
        bestWeight,
        totalVolume
      })
    })
  })

  const exercisesWithData = Array.from(exerciseMap.values())
    .filter(e => e.data.length >= 2) // Only show exercises with at least 2 data points
    .sort((a, b) => b.data.length - a.data.length)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar isAuthenticated={true} />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-zinc-400">Track your progress over time</p>
          </div>

          {exercisesWithData.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {exercisesWithData.slice(0, 8).map((exercise) => (
                <ExerciseProgressChart
                  key={exercise.id}
                  exerciseName={exercise.name}
                  data={exercise.data}
                />
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Not enough data yet</h2>
              <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
                Log more workouts to see your progress. You need at least 2 sessions with the same exercise to see analytics.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
