import * as cheerio from 'cheerio'
import { logger } from '../utils/logger'

export interface DepartmentResult {
  professorLinks: Array<{
    name: string
    url: string
    title?: string
    department?: string
    imageUrl?: string
  }>
  departmentName?: string
}

// Words that indicate a nav/category link rather than a person's name
const NAV_PATTERNS = [
  /^(all\s)?people$/i, /^faculty$/i, /^staff$/i, /^students$/i,
  /^professors?$/i, /^associate\s+professors?$/i, /^assistant\s+professors?$/i,
  /^emerit[ia]\s+professors?$/i, /^visiting\s+professors?$/i,
  /^instructors?$/i, /^postdocs?$/i, /^researchers?$/i,
  /^visitors?\s*[&+]\s*affiliates?$/i, /^graduate\s+students?$/i,
  /^directory$/i, /^home$/i, /^contact$/i, /^about$/i, /^back$/i,
  /^overview$/i, /^search$/i, /^news$/i, /^events$/i, /^admissions$/i,
  /^programs?$/i, /^courses?$/i, /^seminars?$/i, /^resources?$/i,
  /^department/i, /^administration$/i, /^leadership$/i
]

function isNavLink(text: string): boolean {
  const trimmed = text.trim()
  if (NAV_PATTERNS.some((p) => p.test(trimmed))) return true
  // Single word names are almost never real people (except rare mononyms)
  if (!trimmed.includes(' ') && !trimmed.includes(',')) return true
  return false
}

// Heuristic: text looks like a person's name (e.g. "Last, First" or "First Last")
function looksLikePersonName(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 4 || trimmed.length > 80) return false
  if (isNavLink(trimmed)) return false
  // Must contain at least one space or comma (first + last name)
  if (!trimmed.includes(' ') && !trimmed.includes(',')) return false
  // Should start with a letter
  if (!/^[A-Za-zÀ-ÿ]/.test(trimmed)) return false
  // Should not be mostly lowercase words that look like a nav item
  // A name typically has at least 2 capitalized words or a "Last, First" pattern
  const hasComma = /^[A-Za-zÀ-ÿ'-]+,\s+[A-Za-zÀ-ÿ]/.test(trimmed)
  const capWords = trimmed.split(/\s+/).filter((w) => /^[A-ZÀ-Ý]/.test(w)).length
  return hasComma || capWords >= 2
}

export class DepartmentScraper {
  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml'
      }
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }
    return response.text()
  }

  async scrape(url: string): Promise<DepartmentResult> {
    logger.info(`Scraping department page: ${url}`)
    const html = await this.fetchPage(url)
    const $ = cheerio.load(html)
    const baseUrl = new URL(url)

    const result: DepartmentResult = {
      professorLinks: []
    }

    // Try to find department name
    result.departmentName =
      $('h1').first().text().trim() || $('title').text().trim()

    // Common selectors for faculty listing pages
    const selectors = [
      // Common patterns for faculty directories
      '.faculty-member',
      '.faculty-listing .faculty',
      '.people-listing .person',
      '.directory-listing .listing-item',
      '.views-row',
      '.faculty-card',
      '.profile-card',
      '.staff-member',
      '.person-card',
      // Table-based listings
      'table.faculty tbody tr',
      // List-based
      '.faculty-list li',
      '.people-list li',
      // Generic content area links
      '.field-content',
      '.content-area .item'
    ]

    let found = false

    for (const selector of selectors) {
      const elements = $(selector)
      if (elements.length >= 3) {
        // Likely a faculty listing
        elements.each((_i, el) => {
          const $el = $(el)
          const link = $el.find('a').first()
          const name =
            link.text().trim() ||
            $el.find('h2, h3, h4, .name, .title').first().text().trim()
          let href = link.attr('href') || ''

          if (name && looksLikePersonName(name)) {
            if (href && !href.startsWith('http')) {
              href = new URL(href, baseUrl.origin).toString()
            }

            const title = $el
              .find('.position, .job-title, .rank, .field-title')
              .first()
              .text()
              .trim()
            const department = $el
              .find('.department, .dept, .affiliation')
              .first()
              .text()
              .trim()
            const img = $el.find('img').first()
            let imageUrl = img.attr('src') || ''
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = new URL(imageUrl, baseUrl.origin).toString()
            }

            result.professorLinks.push({
              name,
              url: href,
              title: title || undefined,
              department: department || undefined,
              imageUrl: imageUrl || undefined
            })
          }
        })
        found = true
        break
      }
    }

    // Fallback: look for links that seem like professor profiles
    if (!found) {
      $('a').each((_i, el) => {
        const $el = $(el)
        const href = $el.attr('href') || ''
        const text = $el.text().trim()

        // Heuristics for professor profile links
        const isProfileLink =
          href.includes('/people/') ||
          href.includes('/faculty/') ||
          href.includes('/profile/') ||
          href.includes('/directory/') ||
          href.includes('/staff/')

        if (isProfileLink && looksLikePersonName(text)) {
          const fullUrl = href.startsWith('http')
            ? href
            : new URL(href, baseUrl.origin).toString()

          if (!result.professorLinks.some((p) => p.url === fullUrl)) {
            result.professorLinks.push({ name: text, url: fullUrl })
          }
        }
      })
    }

    logger.info(`Found ${result.professorLinks.length} professor links`)
    return result
  }
}
