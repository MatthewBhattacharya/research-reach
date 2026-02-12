import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Profile
  getProfile: () => ipcRenderer.invoke('profile:get'),
  saveProfile: (data: Record<string, unknown>) => ipcRenderer.invoke('profile:save', data),

  // Searches
  createSearch: (data: Record<string, unknown>) => ipcRenderer.invoke('search:create', data),
  getSearches: () => ipcRenderer.invoke('search:list'),
  getSearch: (id: number) => ipcRenderer.invoke('search:get', id),
  deleteSearch: (id: number) => ipcRenderer.invoke('search:delete', id),

  // Professors
  getProfessors: (searchId: number) => ipcRenderer.invoke('professor:list', searchId),
  getProfessor: (id: number) => ipcRenderer.invoke('professor:get', id),
  saveProfessor: (data: Record<string, unknown>) => ipcRenderer.invoke('professor:save', data),
  deleteProfessor: (id: number) => ipcRenderer.invoke('professor:delete', id),

  // Papers
  getPapers: (professorId: number) => ipcRenderer.invoke('paper:list', professorId),
  savePaper: (data: Record<string, unknown>) => ipcRenderer.invoke('paper:save', data),
  deletePaper: (id: number) => ipcRenderer.invoke('paper:delete', id),

  // Contacts
  getContacts: (professorId: number) => ipcRenderer.invoke('contact:list', professorId),
  saveContact: (data: Record<string, unknown>) => ipcRenderer.invoke('contact:save', data),
  deleteContact: (id: number) => ipcRenderer.invoke('contact:delete', id),

  // Emails
  getEmails: (professorId?: number) => ipcRenderer.invoke('email:list', professorId),
  getEmail: (id: number) => ipcRenderer.invoke('email:get', id),
  saveEmail: (data: Record<string, unknown>) => ipcRenderer.invoke('email:save', data),
  deleteEmail: (id: number) => ipcRenderer.invoke('email:delete', id),
  updateEmailStatus: (id: number, status: string) =>
    ipcRenderer.invoke('email:updateStatus', id, status),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),

  // AI
  generateEmail: (context: Record<string, unknown>) => ipcRenderer.invoke('ai:generateEmail', context),
  summarizePapers: (papers: Record<string, unknown>[], interests: string) =>
    ipcRenderer.invoke('ai:summarizePapers', papers, interests),
  rankRelevance: (items: string[], query: string) =>
    ipcRenderer.invoke('ai:rankRelevance', items, query),

  // Scraper
  scrapeDepartment: (url: string) => ipcRenderer.invoke('scraper:department', url),
  scrapeProfessor: (url: string) => ipcRenderer.invoke('scraper:professor', url),
  scrapeGoogleScholar: (name: string) => ipcRenderer.invoke('scraper:googleScholar', name),

  // App
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
  selectFile: (filters?: Record<string, unknown>[]) =>
    ipcRenderer.invoke('app:selectFile', filters)
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api
