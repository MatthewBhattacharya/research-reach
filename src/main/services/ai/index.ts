import { AIProvider } from './provider'
import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'
import { getDb } from '../../db'
import { settings } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '../../utils/logger'

let cachedProvider: AIProvider | null = null
let cachedProviderType: string | null = null

export async function getAIProvider(): Promise<AIProvider> {
  const db = getDb()

  const providerRow = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'ai_provider'))
  const providerType = providerRow[0]?.value || 'anthropic'

  const apiKeyRow = await db
    .select()
    .from(settings)
    .where(eq(settings.key, `${providerType}_api_key`))
  const apiKey = apiKeyRow[0]?.value

  if (!apiKey) {
    throw new Error(
      `No API key configured for ${providerType}. Please add your API key in Settings.`
    )
  }

  if (cachedProvider && cachedProviderType === providerType) {
    return cachedProvider
  }

  logger.info(`Initializing AI provider: ${providerType}`)

  switch (providerType) {
    case 'openai':
      cachedProvider = new OpenAIProvider(apiKey)
      break
    case 'anthropic':
    default:
      cachedProvider = new AnthropicProvider(apiKey)
      break
  }

  cachedProviderType = providerType
  return cachedProvider
}

export function clearProviderCache(): void {
  cachedProvider = null
  cachedProviderType = null
}
