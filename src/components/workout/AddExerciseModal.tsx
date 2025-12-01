'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Exercise {
  id: string
  name: string
  category: string | null
  is_bodyweight: boolean
}

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: { id: string; name: string }) => void
}

export default function AddExerciseModal({ isOpen, onClose, onSelect }: AddExerciseModalProps) {
  const [search, setSearch] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchExercises()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredExercises(exercises)
    } else {
      const searchLower = search.toLowerCase()
      setFilteredExercises(
        exercises.filter(e => e.name.toLowerCase().includes(searchLower))
      )
    }
  }, [search, exercises])

  const fetchExercises = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name')

      if (error) throw error
      setExercises(data || [])
    } catch (err) {
      console.error('Error fetching exercises:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateExercise = async () => {
    if (search.trim() === '') return
    
    setIsCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          user_id: user.id,
          name: search.trim(),
          category: 'other',
          is_bodyweight: false,
        })
        .select()
        .single()

      if (error) throw error

      onSelect({ id: data.id, name: data.name })
      setSearch('')
    } catch (err) {
      console.error('Error creating exercise:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelect = (exercise: Exercise) => {
    onSelect({ id: exercise.id, name: exercise.name })
    setSearch('')
  }

  if (!isOpen) return null

  const showCreateOption = search.trim() !== '' && 
    !exercises.some(e => e.name.toLowerCase() === search.toLowerCase())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Add Exercise</h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises or type to create..."
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Create New Option */}
              {showCreateOption && (
                <button
                  onClick={handleCreateExercise}
                  disabled={isCreating}
                  className="w-full p-3 text-left rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-orange-400">Create &quot;{search}&quot;</div>
                    <div className="text-sm text-zinc-400">Add new exercise</div>
                  </div>
                </button>
              )}

              {/* Existing Exercises */}
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="w-full p-3 text-left rounded-xl hover:bg-zinc-800/50 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                    {exercise.is_bodyweight ? (
                      <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{exercise.name}</div>
                    {exercise.category && (
                      <div className="text-sm text-zinc-500 capitalize">{exercise.category}</div>
                    )}
                  </div>
                </button>
              ))}

              {filteredExercises.length === 0 && !showCreateOption && (
                <div className="text-center py-8 text-zinc-500">
                  No exercises found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

