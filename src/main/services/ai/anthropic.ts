import Anthropic from '@anthropic-ai/sdk'
import { AIProvider, EmailContext } from './provider'
import { logger } from '../../utils/logger'

export class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt || 'You are a helpful assistant.',
      messages: [{ role: 'user', content: prompt }]
    })

    const block = response.content[0]
    if (block.type === 'text') {
      return block.text
    }
    return ''
  }

  async summarizePapers(
    papers: Array<{ title: string; abstract?: string; year?: number }>,
    userInterests: string
  ): Promise<string> {
    const papersText = papers
      .map(
        (p, i) =>
          `${i + 1}. "${p.title}" (${p.year || 'n.d.'})\n   Abstract: ${p.abstract || 'N/A'}`
      )
      .join('\n\n')

    const prompt = `Given the following academic papers and the user's research interests, provide a concise summary of how these papers relate to the user's interests. Highlight the most relevant papers and key themes.

User's Research Interests: ${userInterests}

Papers:
${papersText}

Provide a 2-3 paragraph summary focusing on relevance to the user's interests.`

    return this.generateText(prompt, 'You are an academic research assistant who helps students understand research papers and their relevance.')
  }

  async generateEmail(context: EmailContext): Promise<string> {
    const papersSection = context.selectedPapers
      .map((p) => `- "${p.title}" (${p.year || 'n.d.'})${p.aiSummary ? `: ${p.aiSummary}` : ''}`)
      .join('\n')

    const prompt = `Write a professional cold email from a student to a professor about research opportunities.

PROFESSOR DETAILS:
- Name: ${context.professorName}
- Title: ${context.professorTitle || 'Professor'}
- Department: ${context.professorDepartment || 'N/A'}
- University: ${context.university || 'N/A'}
- Research Summary: ${context.researchSummary || 'N/A'}

STUDENT DETAILS:
- Name: ${context.userName}
- Email: ${context.userEmail}
- University: ${context.userUniversity || 'N/A'}
- Department: ${context.userDepartment || 'N/A'}
- Research Interests: ${context.userResearchInterests || 'N/A'}
${context.userCvText ? `- CV Summary: ${context.userCvText.substring(0, 500)}` : ''}

RELEVANT PAPERS:
${papersSection || 'None selected'}

WORK PERIOD: ${context.workPeriod}
${context.contactName ? `\nREFERRED BY: ${context.contactName} (${context.contactRole || 'lab member'})` : ''}

Write a concise, personalized email (150-250 words) that:
1. Shows genuine familiarity with the professor's specific research
2. References specific papers and what the student found interesting
3. Connects the student's background/interests to the professor's work
4. Clearly states the desired work period
5. Is professional but not overly formal
6. Ends with a clear call to action

Output ONLY the email body (no subject line, no "Dear..." salutation - start with the body content). The greeting and sign-off will be added separately.`

    return this.generateText(
      prompt,
      'You are an expert at writing compelling academic cold emails that get responses. Write naturally and specifically - avoid generic flattery or vague statements.'
    )
  }

  async rankRelevance(items: string[], query: string): Promise<number[]> {
    const itemsList = items.map((item, i) => `${i}: ${item}`).join('\n')

    const prompt = `Rate the relevance of each item to the query on a scale of 0.0 to 1.0.

Query: "${query}"

Items:
${itemsList}

Respond with ONLY a JSON array of numbers (relevance scores), one per item, in the same order. Example: [0.8, 0.3, 0.95]`

    const response = await this.generateText(
      prompt,
      'You are a relevance scoring system. Respond only with a JSON array of numbers.'
    )

    try {
      const match = response.match(/\[[\d.,\s]+\]/)
      if (match) {
        return JSON.parse(match[0])
      }
    } catch (error) {
      logger.error('Failed to parse relevance scores', error)
    }

    return items.map(() => 0.5)
  }
}
