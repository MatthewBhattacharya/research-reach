export interface EmailContext {
  professorName: string
  professorTitle?: string
  professorDepartment?: string
  university?: string
  researchSummary?: string
  selectedPapers: Array<{
    title: string
    year?: number
    abstract?: string
    aiSummary?: string
  }>
  userName: string
  userEmail: string
  userUniversity?: string
  userDepartment?: string
  userResearchInterests?: string
  userCvText?: string
  workPeriod: string
  contactName?: string
  contactRole?: string
}

export interface AIProvider {
  generateText(prompt: string, systemPrompt?: string): Promise<string>
  summarizePapers(
    papers: Array<{ title: string; abstract?: string; year?: number }>,
    userInterests: string
  ): Promise<string>
  generateEmail(context: EmailContext): Promise<string>
  rankRelevance(items: string[], query: string): Promise<number[]>
}
