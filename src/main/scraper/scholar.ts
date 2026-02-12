import * as cheerio from 'cheerio'
import { logger } from '../utils/logger'

export interface ScholarResult {
  papers: Array<{
    title: string
    authors: string
    year?: number
    url?: string
    citedBy?: number
    abstract?: string
    source?: string
  }>
  profileUrl?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Rotate through different user-agent strings to reduce fingerprinting
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
]

export class ScholarScraper {
  private requestCount = 0

  private getUA(): string {
    return USER_AGENTS[this.requestCount % USER_AGENTS.length]
  }

  private async fetchPage(url: string, retries = 3): Promise<string> {
    for (let attempt = 0; attempt < retries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 3s, 8s, 18s
        const delay = Math.min(3000 * Math.pow(2.5, attempt), 30000)
        logger.info(`Scholar rate-limited, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${retries})`)
        await sleep(delay)
      }

      this.requestCount++
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.getUA(),
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      })

      if (response.status === 429) {
        if (attempt === retries - 1) {
          throw new Error('Google Scholar rate limit exceeded after retries')
        }
        continue
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      return response.text()
    }

    throw new Error('Unexpected: exhausted retries')
  }

  async searchByName(name: string): Promise<ScholarResult> {
    logger.info(`Searching Google Scholar for: ${name}`)

    // Add a small random delay before the request (1-3s)
    await sleep(1000 + Math.random() * 2000)

    const query = encodeURIComponent(`author:"${name}"`)
    const url = `https://scholar.google.com/scholar?q=${query}&hl=en&num=20`

    const result: ScholarResult = { papers: [] }

    try {
      const html = await this.fetchPage(url)
      const $ = cheerio.load(html)

      // Check if we hit a CAPTCHA page
      if ($('#gs_captcha_f').length > 0 || html.includes('unusual traffic')) {
        logger.warn('Google Scholar returned a CAPTCHA page — cannot proceed')
        return result
      }

      // Parse search results
      $('.gs_r.gs_or.gs_scl').each((_i, el) => {
        const $el = $(el)

        const titleEl = $el.find('.gs_rt a')
        const title = titleEl.text().trim()
        const paperUrl = titleEl.attr('href') || undefined

        const authorsLine = $el.find('.gs_a').text().trim()
        const authors = authorsLine.split(' - ')[0]?.trim() || ''
        const yearMatch = authorsLine.match(/\b(19|20)\d{2}\b/)

        const abstract = $el.find('.gs_rs').text().trim()

        const citedByText = $el
          .find('.gs_fl a')
          .filter((_i2, a) => $(a).text().includes('Cited by'))
          .text()
        const citedByMatch = citedByText.match(/Cited by (\d+)/)

        if (title) {
          result.papers.push({
            title,
            authors,
            year: yearMatch ? parseInt(yearMatch[0]) : undefined,
            url: paperUrl,
            citedBy: citedByMatch ? parseInt(citedByMatch[1]) : undefined,
            abstract: abstract || undefined,
            source: 'Google Scholar'
          })
        }
      })

      // Try to find the author's profile link
      const profileLink = $('a[href*="/citations?user="]').first()
      if (profileLink.length) {
        result.profileUrl =
          'https://scholar.google.com' + profileLink.attr('href')
      }
    } catch (error) {
      logger.warn('Google Scholar search failed (may be rate-limited)', error)
    }

    logger.info(`Found ${result.papers.length} papers for ${name}`)
    return result
  }

  async getAuthorProfile(profileUrl: string): Promise<ScholarResult> {
    logger.info(`Fetching Scholar profile: ${profileUrl}`)
    const result: ScholarResult = { papers: [], profileUrl }

    await sleep(1000 + Math.random() * 2000)

    try {
      const html = await this.fetchPage(profileUrl)
      const $ = cheerio.load(html)

      $('#gsc_a_b .gsc_a_tr').each((_i, el) => {
        const $el = $(el)
        const titleEl = $el.find('.gsc_a_at')
        const title = titleEl.text().trim()

        const authors = $el.find('.gs_gray').first().text().trim()
        const year =
          parseInt($el.find('.gsc_a_y span').text().trim()) || undefined
        const citedBy =
          parseInt($el.find('.gsc_a_ac').text().trim()) || undefined

        if (title) {
          result.papers.push({
            title,
            authors,
            year,
            citedBy,
            source: 'Google Scholar'
          })
        }
      })
    } catch (error) {
      logger.warn('Scholar profile fetch failed', error)
    }

    return result
  }
}
