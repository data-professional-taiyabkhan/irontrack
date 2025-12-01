import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'

interface WorkoutDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
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

  const dayTypeLabels: Record<string, string> = {
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
    other: session.day_type_label || 'Other',
  }

  const dayTypeColors: Record<string, string> = {
    push: 'bg-blue-500/20 text-blue-400',
    pull: 'bg-green-500/20 text-green-400',
    legs: 'bg-purple-500/20 text-purple-400',
    other: 'bg-zinc-700 text-zinc-300',
  }

  const totalSets = session.session_exercises?.reduce(
    (acc: number, se: { sets: unknown[] }) => acc + (se.sets?.length || 0),
    0
  ) || 0

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar isAuthenticated={true} />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/history" className="text-zinc-400 hover:text-white text-sm mb-2 inline-block">
              ← Back to History
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-lg ${dayTypeColors[session.day_type]}`}>
                {dayTypeLabels[session.day_type]}
              </span>
              {session.status === 'draft' && (
                <span className="px-3 py-1 text-sm font-medium rounded-lg bg-yellow-500/20 text-yellow-400">
                  Draft
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-1">
              {new Date(session.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{session.session_exercises?.length || 0}</div>
              <div className="text-sm text-zinc-400">Exercises</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{totalSets}</div>
              <div className="text-sm text-zinc-400">Sets</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{(session.total_volume || 0).toLocaleString()}</div>
              <div className="text-sm text-zinc-400">Volume (lbs)</div>
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            {session.session_exercises?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index).map((se: {
              id: string
              exercise: { name: string; is_bodyweight: boolean } | null
              sets: Array<{
                id: string
                set_number: number
                weight: number | null
                reps: number | null
                rpe: number | null
                est_1rm: number | null
              }>
            }) => (
              <div key={se.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800/50">
                  <h3 className="font-semibold text-lg">{se.exercise?.name}</h3>
                </div>
                <div className="p-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-2 mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    <div>Set</div>
                    <div>Weight</div>
                    <div>Reps</div>
                    <div>RPE</div>
                    <div>Est. 1RM</div>
                  </div>
                  {/* Sets */}
                  <div className="space-y-2">
                    {se.sets?.sort((a, b) => a.set_number - b.set_number).map((set) => (
                      <div key={set.id} className="grid grid-cols-5 gap-2 py-2 border-t border-zinc-800/30">
                        <div className="flex items-center">
                          <span className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center text-sm">
                            {set.set_number}
                          </span>
                        </div>
                        <div>{set.weight ? `${set.weight} lbs` : '—'}</div>
                        <div>{set.reps || '—'}</div>
                        <div>{set.rpe || '—'}</div>
                        <div className="text-orange-400">{set.est_1rm ? `${Math.round(set.est_1rm)}` : '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="text-zinc-400">{session.notes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

