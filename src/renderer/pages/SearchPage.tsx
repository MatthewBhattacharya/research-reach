import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchStore } from '../stores/searchStore'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoading, LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import {
  Search,
  Plus,
  Globe,
  Trash2,
  ChevronRight,
  Clock
} from 'lucide-react'

export function SearchPage() {
  const navigate = useNavigate()
  const {
    searches,
    loading,
    scraping,
    fetchSearches,
    createSearch,
    deleteSearch,
    scrapeDepartment
  } = useSearchStore()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    universityName: '',
    keywords: '',
    departmentUrl: ''
  })

  useEffect(() => {
    fetchSearches()
  }, [fetchSearches])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const search = await createSearch(form)
    if (search) {
      setForm({ universityName: '', keywords: '', departmentUrl: '' })
      setShowForm(false)

      // If a department URL was provided, start scraping
      if (form.departmentUrl) {
        const result = await scrapeDepartment(form.departmentUrl)
        if (result && (result as any).success) {
          // Navigate to professor list for this search
          navigate(`/search/${search.id}/professors`, {
            state: { scraped: (result as any).data }
          })
          return
        }
      }

      navigate(`/search/${search.id}/professors`)
    }
  }

  if (loading && searches.length === 0) return <PageLoading />

  return (
    <div>
      <PageHeader
        title="Search for Professors"
        description="Find professors whose research aligns with your interests."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            New Search
          </button>
        }
      />

      {showForm && (
        <div className="card p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">University Name *</label>
                <input
                  type="text"
                  className="input"
                  value={form.universityName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      universityName: e.target.value
                    }))
                  }
                  placeholder="e.g. Stanford University"
                  required
                />
              </div>
              <div>
                <label className="label">Research Keywords *</label>
                <input
                  type="text"
                  className="input"
                  value={form.keywords}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, keywords: e.target.value }))
                  }
                  placeholder="e.g. machine learning, NLP"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">
                Department Faculty Page URL (optional)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    className="input pl-10"
                    value={form.departmentUrl}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        departmentUrl: e.target.value
                      }))
                    }
                    placeholder="https://cs.stanford.edu/people/faculty"
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Provide a URL to a department's faculty listing page to
                automatically discover professors.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || scraping}
              >
                {scraping ? (
                  <>
                    <LoadingSpinner className="h-4 w-4" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Create Search
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {searches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No searches yet"
          description="Create a new search to find professors whose research matches your interests."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              New Search
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <div
              key={search.id}
              className="card p-4 flex items-center justify-between hover:border-primary-200 transition-colors cursor-pointer"
              onClick={() =>
                navigate(`/search/${search.id}/professors`)
              }
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">
                  {search.universityName}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="truncate">{search.keywords}</span>
                  {search.departmentUrl && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      URL provided
                    </span>
                  )}
                  {search.createdAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(search.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSearch(search.id)
                  }}
                  className="btn-ghost p-1.5"
                  title="Delete search"
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </button>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
