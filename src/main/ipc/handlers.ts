import { ipcMain, dialog } from 'electron'
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import * as schema from '../db/schema'
import { getAIProvider } from '../services/ai'
import { DepartmentScraper } from '../scraper/department'
import { ProfessorScraper } from '../scraper/professor'
import { ScholarScraper } from '../scraper/scholar'
import { SemanticScholarScraper } from '../scraper/semanticScholar'
import { logger } from '../utils/logger'
import { openExternal } from '../utils/openExternal'
import { readFileSync } from 'fs'

export function registerIpcHandlers(): void {
  registerProfileHandlers()
  registerSearchHandlers()
  registerProfessorHandlers()
  registerPaperHandlers()
  registerContactHandlers()
  registerEmailHandlers()
  registerSettingsHandlers()
  registerAIHandlers()
  registerScraperHandlers()
  registerAppHandlers()
}

function registerProfileHandlers(): void {
  ipcMain.handle('profile:get', async () => {
    const db = getDb()
    const results = await db.select().from(schema.profile).limit(1)
    return results[0] || null
  })

  ipcMain.handle('profile:save', async (_event, data) => {
    const db = getDb()
    const existing = await db.select().from(schema.profile).limit(1)

    if (existing.length > 0) {
      await db
        .update(schema.profile)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(schema.profile.id, 1))
    } else {
      await db.insert(schema.profile).values({ ...data, id: 1 })
    }

    const results = await db.select().from(schema.profile).limit(1)
    return results[0]
  })
}

function registerSearchHandlers(): void {
  ipcMain.handle('search:create', async (_event, data) => {
    const db = getDb()
    const result = await db.insert(schema.searches).values(data).returning()
    return result[0]
  })

  ipcMain.handle('search:list', async () => {
    const db = getDb()
    return db.select().from(schema.searches).orderBy(schema.searches.id)
  })

  ipcMain.handle('search:get', async (_event, id: number) => {
    const db = getDb()
    const results = await db
      .select()
      .from(schema.searches)
      .where(eq(schema.searches.id, id))
    return results[0] || null
  })

  ipcMain.handle('search:delete', async (_event, id: number) => {
    const db = getDb()
    await db.delete(schema.searches).where(eq(schema.searches.id, id))
    return { success: true }
  })
}

function registerProfessorHandlers(): void {
  ipcMain.handle('professor:list', async (_event, searchId: number) => {
    const db = getDb()
    return db
      .select()
      .from(schema.professors)
      .where(eq(schema.professors.searchId, searchId))
      .orderBy(schema.professors.relevanceScore)
  })

  ipcMain.handle('professor:get', async (_event, id: number) => {
    const db = getDb()
    const results = await db
      .select()
      .from(schema.professors)
      .where(eq(schema.professors.id, id))
    return results[0] || null
  })

  ipcMain.handle('professor:save', async (_event, data) => {
    const db = getDb()
    if (data.id) {
      const { id, ...rest } = data
      await db
        .update(schema.professors)
        .set(rest)
        .where(eq(schema.professors.id, id))
      const results = await db
        .select()
        .from(schema.professors)
        .where(eq(schema.professors.id, id))
      return results[0]
    }

    // Deduplicate: check if a professor with the same name already exists for this search
    if (data.searchId && data.name) {
      const existing = await db
        .select()
        .from(schema.professors)
        .where(eq(schema.professors.searchId, data.searchId))
      const duplicate = existing.find(
        (p) => p.name.toLowerCase().trim() === data.name.toLowerCase().trim()
      )
      if (duplicate) {
        return duplicate
      }
    }

    const result = await db.insert(schema.professors).values(data).returning()
    return result[0]
  })

  ipcMain.handle('professor:delete', async (_event, id: number) => {
    const db = getDb()
    await db.delete(schema.professors).where(eq(schema.professors.id, id))
    return { success: true }
  })
}

function registerPaperHandlers(): void {
  ipcMain.handle('paper:list', async (_event, professorId: number) => {
    const db = getDb()
    return db
      .select()
      .from(schema.papers)
      .where(eq(schema.papers.professorId, professorId))
      .orderBy(schema.papers.year)
  })

  ipcMain.handle('paper:save', async (_event, data) => {
    const db = getDb()
    if (data.id) {
      const { id, ...rest } = data
      await db.update(schema.papers).set(rest).where(eq(schema.papers.id, id))
      const results = await db.select().from(schema.papers).where(eq(schema.papers.id, id))
      return results[0]
    }
    const result = await db.insert(schema.papers).values(data).returning()
    return result[0]
  })

  ipcMain.handle('paper:delete', async (_event, id: number) => {
    const db = getDb()
    await db.delete(schema.papers).where(eq(schema.papers.id, id))
    return { success: true }
  })
}

function registerContactHandlers(): void {
  ipcMain.handle('contact:list', async (_event, professorId: number) => {
    const db = getDb()
    return db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.professorId, professorId))
  })

  ipcMain.handle('contact:save', async (_event, data) => {
    const db = getDb()
    if (data.id) {
      const { id, ...rest } = data
      await db.update(schema.contacts).set(rest).where(eq(schema.contacts.id, id))
      const results = await db.select().from(schema.contacts).where(eq(schema.contacts.id, id))
      return results[0]
    }
    const result = await db.insert(schema.contacts).values(data).returning()
    return result[0]
  })

  ipcMain.handle('contact:delete', async (_event, id: number) => {
    const db = getDb()
    await db.delete(schema.contacts).where(eq(schema.contacts.id, id))
    return { success: true }
  })
}

function registerEmailHandlers(): void {
  ipcMain.handle('email:list', async (_event, professorId?: number) => {
    const db = getDb()
    if (professorId) {
      return db
        .select()
        .from(schema.emails)
        .where(eq(schema.emails.professorId, professorId))
        .orderBy(schema.emails.id)
    }
    return db.select().from(schema.emails).orderBy(schema.emails.id)
  })

  ipcMain.handle('email:get', async (_event, id: number) => {
    const db = getDb()
    const results = await db.select().from(schema.emails).where(eq(schema.emails.id, id))
    return results[0] || null
  })

  ipcMain.handle('email:save', async (_event, data) => {
    const db = getDb()
    if (data.id) {
      const { id, ...rest } = data
      await db.update(schema.emails).set(rest).where(eq(schema.emails.id, id))
      const results = await db.select().from(schema.emails).where(eq(schema.emails.id, id))
      return results[0]
    }
    const result = await db.insert(schema.emails).values(data).returning()
    return result[0]
  })

  ipcMain.handle('email:delete', async (_event, id: number) => {
    const db = getDb()
    await db.delete(schema.emails).where(eq(schema.emails.id, id))
    return { success: true }
  })

  ipcMain.handle('email:updateStatus', async (_event, id: number, status: string) => {
    const db = getDb()
    const updates: Record<string, unknown> = { status }
    if (status === 'sent') {
      updates.sentAt = new Date().toISOString()
    }
    await db.update(schema.emails).set(updates).where(eq(schema.emails.id, id))
    const results = await db.select().from(schema.emails).where(eq(schema.emails.id, id))
    return results[0]
  })
}

function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async (_event, key: string) => {
    const db = getDb()
    const results = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, key))
    return results[0]?.value || null
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: string) => {
    const db = getDb()
    const existing = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, key))

    if (existing.length > 0) {
      await db
        .update(schema.settings)
        .set({ value })
        .where(eq(schema.settings.key, key))
    } else {
      await db.insert(schema.settings).values({ key, value })
    }
    return { success: true }
  })

  ipcMain.handle('settings:getAll', async () => {
    const db = getDb()
    const results = await db.select().from(schema.settings)
    const settingsMap: Record<string, string> = {}
    for (const row of results) {
      settingsMap[row.key] = row.value
    }
    return settingsMap
  })
}

function extractAIError(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as any
    // Anthropic SDK error
    if (err.error?.error?.message) return err.error.error.message
    // OpenAI SDK error
    if (err.error?.message) return err.error.message
    // Generic
    if (err.message) return err.message
  }
  return String(error)
}

function registerAIHandlers(): void {
  ipcMain.handle('ai:generateEmail', async (_event, context) => {
    try {
      const provider = await getAIProvider()
      const result = await provider.generateEmail(context)
      return { success: true, data: result }
    } catch (error) {
      logger.error('AI email generation failed', error)
      return { success: false, error: extractAIError(error) }
    }
  })

  ipcMain.handle('ai:summarizePapers', async (_event, papers, interests) => {
    try {
      const provider = await getAIProvider()
      const result = await provider.summarizePapers(papers, interests)
      return { success: true, data: result }
    } catch (error) {
      logger.error('AI paper summarization failed', error)
      return { success: false, error: extractAIError(error) }
    }
  })

  ipcMain.handle('ai:rankRelevance', async (_event, items, query) => {
    try {
      const provider = await getAIProvider()
      const result = await provider.rankRelevance(items, query)
      return { success: true, data: result }
    } catch (error) {
      logger.error('AI relevance ranking failed', error)
      return { success: false, error: String(error) }
    }
  })
}

function registerScraperHandlers(): void {
  ipcMain.handle('scraper:department', async (_event, url: string) => {
    try {
      const scraper = new DepartmentScraper()
      const result = await scraper.scrape(url)
      return { success: true, data: result }
    } catch (error) {
      logger.error('Department scraping failed', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('scraper:professor', async (_event, url: string) => {
    try {
      const scraper = new ProfessorScraper()
      const result = await scraper.scrape(url)
      return { success: true, data: result }
    } catch (error) {
      logger.error('Professor scraping failed', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('scraper:googleScholar', async (_event, name: string) => {
    // Try Semantic Scholar first (free API, no rate limits)
    try {
      const ssScraper = new SemanticScholarScraper()
      const ssResult = await ssScraper.searchByName(name)
      if (ssResult.papers.length > 0) {
        return { success: true, data: ssResult }
      }
    } catch (error) {
      logger.warn('Semantic Scholar failed, trying Google Scholar', error)
    }

    // Fallback to Google Scholar
    try {
      const scraper = new ScholarScraper()
      const result = await scraper.searchByName(name)
      return { success: true, data: result }
    } catch (error) {
      logger.error('All paper search methods failed', error)
      return { success: false, error: 'Could not find papers. Google Scholar may be rate-limiting requests.' }
    }
  })
}

function registerAppHandlers(): void {
  ipcMain.handle('app:openExternal', async (_event, url: string) => {
    await openExternal(url)
    return { success: true }
  })

  ipcMain.handle('app:selectFile', async (_event, filters) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters || [
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    const filePath = result.filePaths[0]
    const content = readFileSync(filePath, 'utf-8')
    return { path: filePath, content }
  })
}
