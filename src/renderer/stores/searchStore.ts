import { create } from 'zustand'

interface Search {
  id: number
  universityName: string
  keywords: string
  departmentUrl?: string
  createdAt?: string
}

interface SearchState {
  searches: Search[]
  currentSearch: Search | null
  loading: boolean
  scraping: boolean
  error: string | null
  fetchSearches: () => Promise<void>
  createSearch: (data: {
    universityName: string
    keywords: string
    departmentUrl?: string
  }) => Promise<Search | null>
  deleteSearch: (id: number) => Promise<void>
  setCurrentSearch: (search: Search | null) => void
  scrapeDepartment: (url: string) => Promise<unknown>
}

export const useSearchStore = create<SearchState>((set, get) => ({
  searches: [],
  currentSearch: null,
  loading: false,
  scraping: false,
  error: null,

  fetchSearches: async () => {
    set({ loading: true, error: null })
    try {
      const searches = await window.api.getSearches()
      set({ searches, loading: false })
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },

  createSearch: async (data) => {
    set({ loading: true, error: null })
    try {
      const search = await window.api.createSearch(data)
      set((state) => ({
        searches: [...state.searches, search],
        currentSearch: search,
        loading: false
      }))
      return search
    } catch (error) {
      set({ error: String(error), loading: false })
      return null
    }
  },

  deleteSearch: async (id) => {
    try {
      await window.api.deleteSearch(id)
      set((state) => ({
        searches: state.searches.filter((s) => s.id !== id),
        currentSearch:
          state.currentSearch?.id === id ? null : state.currentSearch
      }))
    } catch (error) {
      set({ error: String(error) })
    }
  },

  setCurrentSearch: (search) => set({ currentSearch: search }),

  scrapeDepartment: async (url) => {
    set({ scraping: true, error: null })
    try {
      const result = await window.api.scrapeDepartment(url)
      set({ scraping: false })
      return result
    } catch (error) {
      set({ error: String(error), scraping: false })
      return null
    }
  }
}))
