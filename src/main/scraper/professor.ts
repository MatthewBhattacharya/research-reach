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

    // Extract email
    $('a[href^="mailto:"]').each((_i, el) => {
      if (!result.email) {
        const href = $(el).attr('href') || ''
        result.email = href.replace('mailto:', '').split('?')[0].trim()
      }
    })

    // Also check text content for email patterns
    if (!result.email) {
      const bodyText = $('body').text()
      const emailMatch = bodyText.match(/[\w.-]+@[\w.-]+\.\w{2,}/)?.[0]
      if (emailMatch && !emailMatch.includes('example.com')) {
        result.email = emailMatch
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
