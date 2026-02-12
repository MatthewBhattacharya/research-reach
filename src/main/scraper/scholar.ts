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

export class ScholarScraper {
  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }
    return response.text()
  }

  async searchByName(name: string): Promise<ScholarResult> {
    logger.info(`Searching Google Scholar for: ${name}`)

    const query = encodeURIComponent(`author:"${name}"`)
    const url = `https://scholar.google.com/scholar?q=${query}&hl=en&num=20`

    const result: ScholarResult = { papers: [] }

    try {
      const html = await this.fetchPage(url)
      const $ = cheerio.load(html)

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

        const citedByText = $el.find('.gs_fl a')
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
      // Google Scholar is aggressive with rate limiting, so we gracefully handle this
    }

    logger.info(`Found ${result.papers.length} papers for ${name}`)
    return result
  }

  async getAuthorProfile(profileUrl: string): Promise<ScholarResult> {
    logger.info(`Fetching Scholar profile: ${profileUrl}`)
    const result: ScholarResult = { papers: [], profileUrl }

    try {
      const html = await this.fetchPage(profileUrl)
      const $ = cheerio.load(html)

      $('#gsc_a_b .gsc_a_tr').each((_i, el) => {
        const $el = $(el)
        const titleEl = $el.find('.gsc_a_at')
        const title = titleEl.text().trim()

        const authors = $el.find('.gs_gray').first().text().trim()
        const year = parseInt($el.find('.gsc_a_y span').text().trim()) || undefined
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
