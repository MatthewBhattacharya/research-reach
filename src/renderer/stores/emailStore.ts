import { create } from 'zustand'

export interface Email {
  id: number
  professorId?: number
  contactId?: number
  subject: string
  body: string
  recipientEmail?: string
  status?: string
  workPeriod?: string
  selectedPapers?: string
  createdAt?: string
  sentAt?: string
}

interface EmailState {
  emails: Email[]
  currentEmail: Email | null
  generating: boolean
  loading: boolean
  error: string | null
  fetchEmails: (professorId?: number) => Promise<void>
  fetchEmail: (id: number) => Promise<void>
  saveEmail: (data: Partial<Email>) => Promise<Email | null>
  deleteEmail: (id: number) => Promise<void>
  updateStatus: (id: number, status: string) => Promise<void>
  generateEmail: (context: Record<string, unknown>) => Promise<string | null>
  setCurrentEmail: (email: Email | null) => void
}

export const useEmailStore = create<EmailState>((set) => ({
  emails: [],
  currentEmail: null,
  generating: false,
  loading: false,
  error: null,

  fetchEmails: async (professorId?) => {
    set({ loading: true, error: null })
    try {
      const emails = await window.api.getEmails(professorId)
      set({ emails, loading: false })
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },

  fetchEmail: async (id) => {
    set({ loading: true, error: null })
    try {
      const email = await window.api.getEmail(id)
      set({ currentEmail: email, loading: false })
    } catch (error) {
      set({ error: String(error), loading: false })
    }
  },

  saveEmail: async (data) => {
    set({ loading: true, error: null })
    try {
      const email = await window.api.saveEmail(data)
      set((state) => {
        const idx = state.emails.findIndex((e) => e.id === email.id)
        const emails =
          idx >= 0
            ? state.emails.map((e) => (e.id === email.id ? email : e))
            : [...state.emails, email]
        return { emails, currentEmail: email, loading: false }
      })
      return email
    } catch (error) {
      set({ error: String(error), loading: false })
      return null
    }
  },

  deleteEmail: async (id) => {
    try {
      await window.api.deleteEmail(id)
      set((state) => ({
        emails: state.emails.filter((e) => e.id !== id),
        currentEmail:
          state.currentEmail?.id === id ? null : state.currentEmail
      }))
    } catch (error) {
      set({ error: String(error) })
    }
  },

  updateStatus: async (id, status) => {
    try {
      const email = await window.api.updateEmailStatus(id, status)
      set((state) => ({
        emails: state.emails.map((e) => (e.id === id ? email : e)),
        currentEmail:
          state.currentEmail?.id === id ? email : state.currentEmail
      }))
    } catch (error) {
      set({ error: String(error) })
    }
  },

  generateEmail: async (context) => {
    set({ generating: true, error: null })
    try {
      const result = await window.api.generateEmail(context)
      set({ generating: false })
      if (result.success) {
        return result.data
      }
      set({ error: result.error })
      return null
    } catch (error) {
      set({ error: String(error), generating: false })
      return null
    }
  },

  setCurrentEmail: (email) => set({ currentEmail: email })
}))
