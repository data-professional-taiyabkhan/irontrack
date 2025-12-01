'use client'

import { useState } from 'react'

interface WorkoutSet {
  id: string
  weight: number | null
  reps: number | null
  rpe: number | null
  notes: string
}

interface ExerciseCardProps {
  exercise: {
    id: string
    name: string
    sets: WorkoutSet[]
  }
  onRemove: () => void
  onUpdateSets: (sets: WorkoutSet[]) => void
  onOpenRPEInfo: () => void
}

const RPE_OPTIONS = [6, 7, 8, 9, 10]

export default function ExerciseCard({ exercise, onRemove, onUpdateSets, onOpenRPEInfo }: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const updateSet = (setId: string, field: keyof WorkoutSet, value: WorkoutSet[keyof WorkoutSet]) => {
    const updatedSets = exercise.sets.map(set =>
      set.id === setId ? { ...set, [field]: value } : set
    )
    onUpdateSets(updatedSets)
  }

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1]
    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      weight: lastSet?.weight || null,
      reps: lastSet?.reps || null,
      rpe: null,
      notes: '',
    }
    onUpdateSets([...exercise.sets, newSet])
  }

  const duplicateSet = (setId: string) => {
    const setToDuplicate = exercise.sets.find(s => s.id === setId)
    if (!setToDuplicate) return
    
    const newSet: WorkoutSet = {
      ...setToDuplicate,
      id: crypto.randomUUID(),
    }
    const setIndex = exercise.sets.findIndex(s => s.id === setId)
    const newSets = [...exercise.sets]
    newSets.splice(setIndex + 1, 0, newSet)
    onUpdateSets(newSets)
  }

  const removeSet = (setId: string) => {
    if (exercise.sets.length <= 1) return
    onUpdateSets(exercise.sets.filter(s => s.id !== setId))
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
      {/* Exercise Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="font-semibold text-lg">{exercise.name}</span>
          <span className="text-zinc-500 text-sm">
            {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
          </span>
        </button>
        <button
          onClick={onRemove}
          className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
          title="Remove exercise"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Sets */}
      {isExpanded && (
        <div className="p-4">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <div className="col-span-1">Set</div>
            <div className="col-span-3">Weight</div>
            <div className="col-span-2">Reps</div>
            <div className="col-span-3">
              <button
                onClick={onOpenRPEInfo}
                className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
              >
                RPE
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <div className="col-span-3"></div>
          </div>

          {/* Set Rows */}
          <div className="space-y-2">
            {exercise.sets.map((set, index) => (
              <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                {/* Set Number */}
                <div className="col-span-1">
                  <span className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                </div>

                {/* Weight */}
                <div className="col-span-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={set.weight ?? ''}
                      onChange={(e) => updateSet(set.id, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">lbs</span>
                  </div>
                </div>

                {/* Reps */}
                <div className="col-span-2">
                  <input
                    type="number"
                    value={set.reps ?? ''}
                    onChange={(e) => updateSet(set.id, 'reps', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                  />
                </div>

                {/* RPE */}
                <div className="col-span-3">
                  <select
                    value={set.rpe ?? ''}
                    onChange={(e) => updateSet(set.id, 'rpe', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">—</option>
                    {RPE_OPTIONS.map((rpe) => (
                      <option key={rpe} value={rpe}>
                        {rpe}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="col-span-3 flex justify-end gap-1">
                  <button
                    onClick={() => duplicateSet(set.id)}
                    className="p-2 text-zinc-500 hover:text-white transition-colors"
                    title="Duplicate set"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {exercise.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(set.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Remove set"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Set Button */}
          <button
            onClick={addSet}
            className="mt-4 w-full py-2 text-sm text-zinc-400 hover:text-white border border-dashed border-zinc-700/50 rounded-lg hover:border-zinc-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Set
          </button>
        </div>
      )}
    </div>
  )
}

