import * as cheerio from 'cheerio'
import { logger } from '../utils/logger'

export interface ProfessorResult {
  name?: string
  title?: string
  department?: string
  email?: string
  phone?: string
  office?: string
  imageUrl?: string
  researchSummary?: string
  researchAreas?: string[]
  publications?: Array<{
    title: string
    authors?: string
    year?: number
    url?: string
  }>
  labMembers?: Array<{
    name: string
    role?: string
    email?: string
    url?: string
  }>
  websiteUrl?: string
}

export class ProfessorScraper {
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

  async scrape(url: string): Promise<ProfessorResult> {
    logger.info(`Scraping professor profile: ${url}`)
    const html = await this.fetchPage(url)
    const $ = cheerio.load(html)
    const baseUrl = new URL(url)

    const result: ProfessorResult = {
      websiteUrl: url
    }

    // Extract name
    result.name =
      $('h1.professor-name, h1.page-title, h1.entry-title, h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim()

    // Extract title/position
    const titleSelectors = [
      '.title', '.position', '.job-title', '.rank',
      '.field-field-title', '.professor-title'
    ]
    for (const sel of titleSelectors) {
      const text = $(sel).first().text().trim()
      if (text && text.length < 100) {
        result.title = text
        break
      }
    }

    // Extract department
    const deptSelectors = ['.department', '.dept', '.affiliation', '.field-department']
    for (const sel of deptSelectors) {
      const text = $(sel).first().text().trim()
      if (text && text.length < 100) {
        result.department = text
        break
      }
    }

    // Extract email — collect all candidates and pick the best one
    const emailCandidates: string[] = []

    // Gather mailto: links
    $('a[href^="mailto:"]').each((_i, el) => {
      const href = $(el).attr('href') || ''
      const addr = href.replace('mailto:', '').split('?')[0].trim().toLowerCase()
      if (addr && addr.includes('@')) {
        emailCandidates.push(addr)
      }
    })

    // Gather emails from text content
    const bodyText = $('body').text()
    const textEmails = bodyText.match(/[\w.-]+@[\w.-]+\.\w{2,}/g) || []
    for (const addr of textEmails) {
      const lower = addr.toLowerCase()
      if (!emailCandidates.includes(lower)) {
        emailCandidates.push(lower)
      }
    }

    // Score candidates: prefer personal emails over generic/department ones
    const genericPrefixes = [
      'info', 'admin', 'office', 'help', 'support', 'contact', 'webmaster',
      'web', 'dept', 'department', 'general', 'enquiries', 'inquiries',
      'reception', 'secretary', 'mail', 'noreply', 'no-reply',
      'admissions', 'gradadmissions', 'building', 'hr', 'registrar',
      'feedback', 'press', 'media', 'communications', 'safety'
    ]

    function scoreEmail(addr: string, profName?: string): number {
      let score = 0
      const local = addr.split('@')[0]
      const domain = addr.split('@')[1] || ''

      // Penalize generic prefixes heavily
      if (genericPrefixes.some((p) => local.startsWith(p))) score -= 50
      // Penalize addresses with "help", "web", "admin" anywhere
      if (/help|web_help|admin|office|support/.test(local)) score -= 40

      // Boost if domain is .edu
      if (domain.endsWith('.edu')) score += 5

      // Boost if the local part contains parts of the professor's name
      if (profName) {
        const nameParts = profName
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((p) => p.length > 2)
        for (const part of nameParts) {
          if (local.includes(part)) score += 15
        }
      }

      // Penalize example/placeholder addresses
      if (domain.includes('example.com') || domain.includes('test.com')) score -= 100

      return score
    }

    if (emailCandidates.length > 0) {
      // Score and sort, pick best
      const scored = emailCandidates.map((addr) => ({
        addr,
        score: scoreEmail(addr, result.name)
      }))
      scored.sort((a, b) => b.score - a.score)
      // Only use the email if it scores above 0 (likely personal, not generic)
      if (scored[0].score > 0) {
        result.email = scored[0].addr
      }
    }

    // Extract image
    const imgSelectors = [
      '.profile-image img',
      '.faculty-photo img',
      '.portrait img',
      '.headshot img',
      '.photo img',
      'img.professor',
      'img.profile-pic',
      '.content img'
    ]
    for (const sel of imgSelectors) {
      const src = $(sel).first().attr('src')
      if (src) {
        result.imageUrl = src.startsWith('http')
          ? src
          : new URL(src, baseUrl.origin).toString()
        break
      }
    }

    // Extract research summary / bio
    const bioSelectors = [
      '.biography', '.bio', '.research-interests',
      '.research-description', '.about', '.profile-body',
      '#research', '#biography', '.field-body'
    ]
    for (const sel of bioSelectors) {
      const text = $(sel).first().text().trim()
      if (text && text.length > 50) {
        result.researchSummary = text.substring(0, 2000)
        break
      }
    }

    // Fallback: get main content text
    if (!result.researchSummary) {
      const mainContent = $(
        'main, .content, .main-content, article, #content'
      )
        .first()
        .text()
        .trim()
      if (mainContent.length > 100) {
        result.researchSummary = mainContent.substring(0, 2000)
      }
    }

    // Extract research areas
    result.researchAreas = []
    const areaSelectors = [
      '.research-areas li',
      '.interests li',
      '.research-topics li',
      '.keywords li',
      '.tags a'
    ]
    for (const sel of areaSelectors) {
      $(sel).each((_i, el) => {
        const text = $(el).text().trim()
        if (text && text.length < 100) {
          result.researchAreas!.push(text)
        }
      })
      if (result.researchAreas.length > 0) break
    }

    // Extract publications
    result.publications = []
    const pubSelectors = [
      '.publications li',
      '.pub-list li',
      '.bibliography li',
      '#publications li',
      '.publication-item'
    ]
    for (const sel of pubSelectors) {
      $(sel)
        .slice(0, 20)
        .each((_i, el) => {
          const $el = $(el)
          const title =
            $el.find('a, .title, strong, em').first().text().trim() ||
            $el.text().trim()
          if (title && title.length > 10 && title.length < 300) {
            const link = $el.find('a').first()
            let pubUrl = link.attr('href') || ''
            if (pubUrl && !pubUrl.startsWith('http')) {
              pubUrl = new URL(pubUrl, baseUrl.origin).toString()
            }

            const yearMatch = $el.text().match(/\b(19|20)\d{2}\b/)

            result.publications!.push({
              title: title.substring(0, 200),
              year: yearMatch ? parseInt(yearMatch[0]) : undefined,
              url: pubUrl || undefined
            })
          }
        })
      if (result.publications.length > 0) break
    }

    // Extract lab members / people
    result.labMembers = []
    const peopleSelectors = [
      '.lab-members li',
      '.people-list li',
      '.team-member',
      '.group-member',
      '#people li',
      '#lab-members li'
    ]
    for (const sel of peopleSelectors) {
      $(sel).each((_i, el) => {
        const $el = $(el)
        const name =
          $el.find('a, .name, strong').first().text().trim() || $el.text().trim()
        if (name && name.length > 2 && name.length < 80) {
          const role = $el.find('.role, .position, .title').first().text().trim()
          const email = $el
            .find('a[href^="mailto:"]')
            .attr('href')
            ?.replace('mailto:', '')
          const memberUrl = $el.find('a').first().attr('href') || ''

          result.labMembers!.push({
            name,
            role: role || undefined,
            email: email || undefined,
            url: memberUrl
              ? memberUrl.startsWith('http')
                ? memberUrl
                : new URL(memberUrl, baseUrl.origin).toString()
              : undefined
          })
        }
      })
      if (result.labMembers.length > 0) break
    }

    logger.info(`Scraped professor profile: ${result.name || 'unknown'}`)
    return result
  }
}
