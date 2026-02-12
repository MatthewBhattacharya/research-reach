import { create } from 'zustand'

interface SettingsState {
  settings: Record<string, string>
  loading: boolean
  error: string | null
  fetchSettings: () => Promise<void>
  setSetting: (key: string, value: string) => Promise<void>
  getSetting: (key: string) => string | null
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null })
    try {
      const settings = await window.api.getAllSettings()
      set({ settings, loading: false })
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },

  setSetting: async (key, value) => {
    try {
      await window.api.setSetting(key, value)
      set((state) => ({
        settings: { ...state.settings, [key]: value }
      }))
    } catch (error) {
      set({ error: String(error) })
    }
  },

  getSetting: (key) => {
    return get().settings[key] || null
  }
}))
