import { create } from 'zustand'

interface Profile {
  id?: number
  name: string
  email: string
  university?: string
  department?: string
  researchInterests?: string
  cvPath?: string
  cvText?: string
}

interface ProfileState {
  profile: Profile | null
  loading: boolean
  error: string | null
  fetchProfile: () => Promise<void>
  saveProfile: (data: Partial<Profile>) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null })
    try {
      const profile = await window.api.getProfile()
      set({ profile, loading: false })
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },

  saveProfile: async (data) => {
    set({ loading: true, error: null })
    try {
      const profile = await window.api.saveProfile(data)
      set({ profile, loading: false })
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  }
}))
