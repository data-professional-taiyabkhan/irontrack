// Database types for IronTrack
// These will be expanded as we create the database schema

export type DayType = 'push' | 'pull' | 'legs' | 'other'
export type WorkoutStatus = 'draft' | 'completed'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type ThemePreference = 'light' | 'hardcore' | 'system'

export interface Profile {
  id: string
  email: string
  name: string | null
  experience_level: ExperienceLevel | null
  theme_preference: ThemePreference
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  user_id: string | null
  name: string
  category: string | null
  is_bodyweight: boolean
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  date: string
  day_type: DayType
  day_type_label: string | null
  status: WorkoutStatus
  total_volume: number | null
  created_at: string
  updated_at: string
}

export interface SessionExercise {
  id: string
  session_id: string
  exercise_id: string
  order_index: number
  notes: string | null
}

export interface Set {
  id: string
  session_exercise_id: string
  set_number: number
  weight: number | null
  reps: number
  rpe: number | null
  notes: string | null
  est_1rm: number | null
  created_at: string
}

