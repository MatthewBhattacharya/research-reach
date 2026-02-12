import { logger } from '../utils/logger'

export interface SemanticScholarResult {
  papers: Array<{
    title: string
    authors: string
    year?: number
    url?: string
    citedBy?: number
    abstract?: string
    source: string
  }>
}

const API_BASE = 'https://api.semanticscholar.org/graph/v1'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// In-memory cache: name -> { result, timestamp }
const cache = new Map<string, { result: SemanticScholarResult; ts: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export class SemanticScholarScraper {
  private async fetchWithRetry(url: string, retries = 4): Promise<any | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
      if (attempt > 0) {
        // Longer backoff: 5s, 15s, 45s
        const delay = 5000 * Math.pow(3, attempt - 1) + Math.random() * 2000
        logger.info(
          `Semantic Scholar rate-limited, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${retries})`
        )
        await sleep(delay)
      }

      const res = await fetch(url, {
        headers: { Accept: 'application/json' }
      })

      if (res.status === 429) {
        if (attempt === retries - 1) {
          logger.warn('Semantic Scholar rate limit exceeded after retries')
          return null
        }
        continue
      }

      if (!res.ok) {
        logger.warn(`Semantic Scholar request failed: ${res.status}`)
        return null
      }

      return res.json()
    }
    return null
  }

  async searchByName(name: string): Promise<SemanticScholarResult> {
    // Check cache first
    const cacheKey = name.toLowerCase().trim()
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      logger.info(`Semantic Scholar cache hit for: ${name} (${cached.result.papers.length} papers)`)
      return cached.result
    }

    logger.info(`Searching Semantic Scholar for author: ${name}`)
    const result: SemanticScholarResult = { papers: [] }

    // Normalize name: "Last, First" -> "First Last"
    let normalizedName = name
    if (name.includes(',')) {
      const parts = name.split(',').map((s) => s.trim())
      normalizedName = `${parts[1]} ${parts[0]}`
    }

    // Extract name parts for matching (ignore short parts like initials)
    const nameParts = normalizedName
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((p) => p.length > 2)

    try {
      const query = encodeURIComponent(`"${normalizedName}"`)
      const data = await this.fetchWithRetry(
        `${API_BASE}/paper/search?query=${query}&fields=title,authors,year,url,citationCount,abstract,externalIds&limit=40`
      )
      if (!data) return result

      // Filter to only papers where the person is actually an author
      for (const paper of data.data || []) {
        if (!paper.title) continue
        const authors: Array<{ name: string }> = paper.authors || []
        const isAuthor = authors.some((a) => {
          const authorLower = (a.name || '').toLowerCase()
          return nameParts.every((part) => authorLower.includes(part))
        })

        if (isAuthor) {
          const doi = paper.externalIds?.DOI
          const paperUrl = doi
            ? `https://doi.org/${doi}`
            : paper.url || undefined

          result.papers.push({
            title: paper.title,
            authors: authors.map((a) => a.name).join(', '),
            year: paper.year || undefined,
            url: paperUrl,
            citedBy: paper.citationCount || undefined,
            abstract: paper.abstract || undefined,
            source: 'Semantic Scholar'
          })

          if (result.papers.length >= 20) break
        }
      }
    } catch (error) {
      logger.warn('Semantic Scholar search failed', error)
    }

    // Cache the result (even if empty, to avoid re-hitting a rate limit)
    cache.set(cacheKey, { result, ts: Date.now() })

    logger.info(
      `Found ${result.papers.length} papers on Semantic Scholar for ${name}`
    )
    return result
  }
}
