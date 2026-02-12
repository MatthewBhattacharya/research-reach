import { create } from 'zustand'

export interface Professor {
  id: number
  searchId?: number
  name: string
  title?: string
  department?: string
  profileUrl?: string
  email?: string
  researchSummary?: string
  imageUrl?: string
  relevanceScore?: number
  createdAt?: string
}

export interface Paper {
  id: number
  professorId?: number
  title: string
  authors?: string
  abstract?: string
  url?: string
  year?: number
  source?: string
  relevanceScore?: number
  aiSummary?: string
  createdAt?: string
}

export interface Contact {
  id: number
  professorId?: number
  name: string
  role?: string
  email?: string
  profileUrl?: string
  isRecommendedContact?: boolean
  recommendationReason?: string
}

interface ProfessorState {
  professors: Professor[]
  currentProfessor: Professor | null
  papers: Paper[]
  contacts: Contact[]
  loading: boolean
  error: string | null
  fetchProfessors: (searchId: number) => Promise<void>
  fetchProfessor: (id: number) => Promise<void>
  saveProfessor: (data: Partial<Professor>) => Promise<Professor | null>
  deleteProfessor: (id: number) => Promise<void>
  fetchPapers: (professorId: number) => Promise<void>
  savePaper: (data: Partial<Paper>) => Promise<void>
  deletePaper: (id: number) => Promise<void>
  fetchContacts: (professorId: number) => Promise<void>
  saveContact: (data: Partial<Contact>) => Promise<void>
  deleteContact: (id: number) => Promise<void>
  scrapeProfessor: (url: string) => Promise<unknown>
  scrapeScholar: (name: string) => Promise<unknown>
}

export const useProfessorStore = create<ProfessorState>((set) => ({
  professors: [],
  currentProfessor: null,
  papers: [],
  contacts: [],
  loading: false,
  error: null,

  fetchProfessors: async (searchId) => {
    set({ loading: true, error: null })
    try {
      const professors = await window.api.getProfessors(searchId)
      set({ professors, loading: false })
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },

  fetchProfessor: async (id) => {
    set({ loading: true, error: null })
    try {
      const professor = await window.api.getProfessor(id)
      set({ currentProfessor: professor, loading: false })
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },

  saveProfessor: async (data) => {
    try {
      const professor = await window.api.saveProfessor(data)
      set((state) => {
        const idx = state.professors.findIndex((p) => p.id === professor.id)
        const professors =
          idx >= 0
            ? state.professors.map((p) => (p.id === professor.id ? professor : p))
            : [...state.professors, professor]
        return { professors, currentProfessor: professor }
      })
      return professor
    } catch (error) {
      set({ error: String(error) })
      return null
    }
  },

  deleteProfessor: async (id) => {
    try {
      await window.api.deleteProfessor(id)
      set((state) => ({
        professors: state.professors.filter((p) => p.id !== id),
        currentProfessor:
          state.currentProfessor?.id === id ? null : state.currentProfessor
      }))
    } catch (error) {
      set({ error: String(error) })
    }
  },

  fetchPapers: async (professorId) => {
    try {
      const papers = await window.api.getPapers(professorId)
      set({ papers })
    } catch (error) {
      set({ error: String(error) })
    }
  },

  savePaper: async (data) => {
    try {
      const paper = await window.api.savePaper(data)
      set((state) => {
        const idx = state.papers.findIndex((p) => p.id === paper.id)
        return {
          papers:
            idx >= 0
              ? state.papers.map((p) => (p.id === paper.id ? paper : p))
              : [...state.papers, paper]
        }
      })
    } catch (error) {
      set({ error: String(error) })
    }
  },

  deletePaper: async (id) => {
    try {
      await window.api.deletePaper(id)
      set((state) => ({
        papers: state.papers.filter((p) => p.id !== id)
      }))
    } catch (error) {
      set({ error: String(error) })
    }
  },

  fetchContacts: async (professorId) => {
    try {
      const contacts = await window.api.getContacts(professorId)
      set({ contacts })
    } catch (error) {
      set({ error: String(error) })
    }
  },

  saveContact: async (data) => {
    try {
      const contact = await window.api.saveContact(data)
      set((state) => {
        const idx = state.contacts.findIndex((c) => c.id === contact.id)
        return {
          contacts:
            idx >= 0
              ? state.contacts.map((c) => (c.id === contact.id ? contact : c))
              : [...state.contacts, contact]
        }
      })
    } catch (error) {
      set({ error: String(error) })
    }
  },

  deleteContact: async (id) => {
    try {
      await window.api.deleteContact(id)
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id)
      }))
    } catch (error) {
      set({ error: String(error) })
    }
  },

  scrapeProfessor: async (url) => {
    try {
      const result = await window.api.scrapeProfessor(url)
      return result
    } catch (error) {
      set({ error: String(error) })
      return null
    }
  },

  scrapeScholar: async (name) => {
    try {
      const result = await window.api.scrapeGoogleScholar(name)
      return result
    } catch (error) {
      set({ error: String(error) })
      return null
    }
  }
}))
