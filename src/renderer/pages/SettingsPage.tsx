import { useEffect, useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoading } from '../components/ui/LoadingSpinner'
import { Save, CheckCircle, Eye, EyeOff, Key } from 'lucide-react'

export function SettingsPage() {
  const { settings, loading, fetchSettings, setSetting } = useSettingsStore()
  const [saved, setSaved] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState({
    ai_provider: 'anthropic',
    anthropic_api_key: '',
    openai_api_key: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    setForm({
      ai_provider: settings.ai_provider || 'anthropic',
      anthropic_api_key: settings.anthropic_api_key || '',
      openai_api_key: settings.openai_api_key || ''
    })
  }, [settings])

  const handleSave = async () => {
    for (const [key, value] of Object.entries(form)) {
      if (value !== (settings[key] || '')) {
        await setSetting(key, value)
      }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading && Object.keys(settings).length === 0) {
    return <PageLoading message="Loading settings..." />
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your AI provider and API keys."
      />

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            AI Provider
          </h2>

          <div className="space-y-3">
            <label className="label">Provider</label>
            <div className="flex gap-3">
              {[
                { id: 'anthropic', name: 'Anthropic (Claude)', desc: 'Recommended' },
                { id: 'openai', name: 'OpenAI (GPT-4o)', desc: 'Alternative' }
              ].map((provider) => (
                <label
                  key={provider.id}
                  className={`flex-1 card p-4 cursor-pointer transition-colors ${
                    form.ai_provider === provider.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="ai_provider"
                      value={provider.id}
                      checked={form.ai_provider === provider.id}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          ai_provider: e.target.value
                        }))
                      }
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900 text-sm">
                        {provider.name}
                      </span>
                      <p className="text-xs text-gray-500">{provider.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">
                Anthropic API Key
                {form.ai_provider === 'anthropic' && (
                  <span className="ml-2 badge-blue text-xs">Active</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showKeys.anthropic ? 'text' : 'password'}
                  className="input pr-10"
                  value={form.anthropic_api_key}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      anthropic_api_key: e.target.value
                    }))
                  }
                  placeholder="sk-ant-..."
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('anthropic')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys.anthropic ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="label">
                OpenAI API Key
                {form.ai_provider === 'openai' && (
                  <span className="ml-2 badge-blue text-xs">Active</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showKeys.openai ? 'text' : 'password'}
                  className="input pr-10"
                  value={form.openai_api_key}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      openai_api_key: e.target.value
                    }))
                  }
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('openai')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys.openai ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            API keys are stored locally in the app database and never sent anywhere except to the respective AI provider.
          </p>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary">
            {saved ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
