'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'

interface Profile {
  id: string
  email: string
  name: string | null
  experience_level: string | null
  theme_preference: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }

      if (data) {
        setProfile(data)
        setName(data.name || '')
        setExperienceLevel(data.experience_level || '')
      } else {
        // Create profile if doesn't exist
        setProfile({
          id: user.id,
          email: user.email || '',
          name: null,
          experience_level: null,
          theme_preference: 'light'
        })
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          email: profile.email,
          name: name || null,
          experience_level: experienceLevel || null,
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      console.error('Error saving profile:', err)
      setMessage({ type: 'error', text: 'Failed to save profile' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Fetch all user data
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          *,
          session_exercises (
            *,
            exercise:exercises (*),
            sets (*)
          )
        `)
        .eq('user_id', user.id)

      const { data: exercises } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: { ...profile, name, experienceLevel },
        exercises,
        sessions,
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `irontrack-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: 'Data exported successfully!' })
    } catch (err) {
      console.error('Error exporting data:', err)
      setMessage({ type: 'error', text: 'Failed to export data' })
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      
      // Delete user data (cascades will handle related data)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete exercises first
      await supabase.from('exercises').delete().eq('user_id', user.id)
      
      // Delete sessions (will cascade to session_exercises and sets)
      await supabase.from('sessions').delete().eq('user_id', user.id)
      
      // Delete profile
      await supabase.from('profiles').delete().eq('id', user.id)

      // Sign out
      await supabase.auth.signOut()
      
      router.push('/')
    } catch (err) {
      console.error('Error deleting account:', err)
      setMessage({ type: 'error', text: 'Failed to delete account' })
      setIsDeleting(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar isAuthenticated={true} />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile</h1>
            <p className="text-zinc-400">Manage your account settings</p>
          </div>

          {/* Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Settings */}
          <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/30 rounded-xl text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
                >
                  <option value="">Select level...</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <Button onClick={handleSaveProfile} isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Data Management</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Export Data</div>
                    <div className="text-sm text-zinc-400">Download all your workout data as JSON</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </section>

          {/* Account Actions */}
          <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Account</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Log Out</div>
                    <div className="text-sm text-zinc-400">Sign out of your account</div>
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-300">
                  Type <span className="font-mono font-bold text-white">DELETE</span> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete My Account'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

