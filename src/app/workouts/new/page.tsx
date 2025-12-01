'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import ExerciseCard from '@/components/workout/ExerciseCard'
import AddExerciseModal from '@/components/workout/AddExerciseModal'
import RPEInfoModal from '@/components/workout/RPEInfoModal'
import type { DayType } from '@/types/database'

interface WorkoutExercise {
  id: string
  exerciseId: string
  name: string
  sets: WorkoutSet[]
}

interface WorkoutSet {
  id: string
  weight: number | null
  reps: number | null
  rpe: number | null
  notes: string
}

const DAY_TYPES: { value: DayType; label: string; emoji: string }[] = [
  { value: 'push', label: 'Push', emoji: '💪' },
  { value: 'pull', label: 'Pull', emoji: '🏋️' },
  { value: 'legs', label: 'Legs', emoji: '🦵' },
  { value: 'other', label: 'Other', emoji: '⚡' },
]

export default function NewWorkoutPage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dayType, setDayType] = useState<DayType>('push')
  const [customLabel, setCustomLabel] = useState('')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false)
  const [isRPEInfoOpen, setIsRPEInfoOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddExercise = (exercise: { id: string; name: string }) => {
    const newExercise: WorkoutExercise = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      name: exercise.name,
      sets: [
        { id: crypto.randomUUID(), weight: null, reps: null, rpe: null, notes: '' }
      ],
    }
    setExercises([...exercises, newExercise])
    setIsAddExerciseOpen(false)
  }

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises(exercises.filter(e => e.id !== exerciseId))
  }

  const handleUpdateSets = (exerciseId: string, sets: WorkoutSet[]) => {
    setExercises(exercises.map(e => 
      e.id === exerciseId ? { ...e, sets } : e
    ))
  }

  const calculateTotalVolume = () => {
    return exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((setTotal, set) => {
        if (set.weight && set.reps) {
          return setTotal + (set.weight * set.reps)
        }
        return setTotal
      }, 0)
    }, 0)
  }

  const handleSaveWorkout = async (status: 'draft' | 'completed') => {
    if (exercises.length === 0) {
      setError('Add at least one exercise to save your workout')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          date,
          day_type: dayType,
          day_type_label: dayType === 'other' ? customLabel : null,
          status,
          total_volume: calculateTotalVolume(),
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create session exercises and sets
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i]
        
        // Create session exercise
        const { data: sessionExercise, error: seError } = await supabase
          .from('session_exercises')
          .insert({
            session_id: session.id,
            exercise_id: exercise.exerciseId,
            order_index: i,
          })
          .select()
          .single()

        if (seError) throw seError

        // Create sets
        const setsToInsert = exercise.sets
          .filter(set => set.reps !== null && set.reps > 0)
          .map((set, index) => ({
            session_exercise_id: sessionExercise.id,
            set_number: index + 1,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            notes: set.notes || null,
          }))

        if (setsToInsert.length > 0) {
          const { error: setsError } = await supabase
            .from('sets')
            .insert(setsToInsert)

          if (setsError) throw setsError
        }
      }

      // Redirect based on status
      if (status === 'completed') {
        router.push(`/workouts/${session.id}/summary`)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Error saving workout:', err)
      setError('Failed to save workout. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar isAuthenticated={true} />

      <main className="pt-24 pb-32 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/dashboard" className="text-zinc-400 hover:text-white text-sm mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Log Workout</h1>
            </div>
            <button
              onClick={() => setIsRPEInfoOpen(true)}
              className="text-zinc-400 hover:text-white text-sm flex items-center gap-1"
            >
              <span>What&apos;s RPE?</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Date & Day Type */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              {/* Day Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Day Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DAY_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setDayType(type.value)}
                      className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        dayType === type.value
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                      }`}
                    >
                      <span className="block text-lg mb-1">{type.emoji}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Label for Other */}
            {dayType === 'other' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Custom Day Label
                </label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g., Full Body, Cardio, Arms"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            )}
          </div>

          {/* Exercises */}
          <div className="space-y-4 mb-6">
            {exercises.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800/50 border-dashed rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No exercises yet</h3>
                <p className="text-zinc-400 mb-6">Add your first exercise to start logging</p>
                <Button onClick={() => setIsAddExerciseOpen(true)}>
                  Add Exercise
                </Button>
              </div>
            ) : (
              exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onRemove={() => handleRemoveExercise(exercise.id)}
                  onUpdateSets={(sets) => handleUpdateSets(exercise.id, sets)}
                  onOpenRPEInfo={() => setIsRPEInfoOpen(true)}
                />
              ))
            )}
          </div>

          {/* Add Exercise Button */}
          {exercises.length > 0 && (
            <button
              onClick={() => setIsAddExerciseOpen(true)}
              className="w-full py-4 border-2 border-dashed border-zinc-700/50 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another Exercise
            </button>
          )}

          {/* Summary Bar */}
          {exercises.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/50 p-4">
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-zinc-400">Total Volume: </span>
                  <span className="font-semibold text-white">{calculateTotalVolume().toLocaleString()} lbs</span>
                  <span className="text-zinc-600 mx-2">•</span>
                  <span className="text-zinc-400">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleSaveWorkout('draft')}
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Save Draft
                  </Button>
                  <Button
                    onClick={() => handleSaveWorkout('completed')}
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Finish Workout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddExerciseModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onSelect={handleAddExercise}
      />
      <RPEInfoModal
        isOpen={isRPEInfoOpen}
        onClose={() => setIsRPEInfoOpen(false)}
      />
    </div>
  )
}

