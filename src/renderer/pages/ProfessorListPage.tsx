import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useProfessorStore, type Professor } from '../stores/professorStore'
import { useSearchStore } from '../stores/searchStore'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoading, LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { RelevanceBadge } from '../components/ui/RelevanceBadge'
import {
  Users,
  Plus,
  Trash2,
  ExternalLink,
  Mail,
  ChevronRight,
  Download,
  UserPlus
} from 'lucide-react'

export function ProfessorListPage() {
  const { searchId } = useParams<{ searchId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { professors, loading, fetchProfessors, saveProfessor, deleteProfessor } =
    useProfessorStore()
  const { searches } = useSearchStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', profileUrl: '', email: '' })

  const sid = parseInt(searchId || '0')
  const search = searches.find((s) => s.id === sid)

  useEffect(() => {
    if (sid) {
      fetchProfessors(sid)
    }
  }, [sid, fetchProfessors])

  // Handle scraped data from navigation state
  useEffect(() => {
    const state = location.state as { scraped?: any } | null
    if (state?.scraped?.professorLinks) {
      importScrapedProfessors(state.scraped.professorLinks)
      // Clear navigation state
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const importScrapedProfessors = async (
    links: Array<{ name: string; url: string; title?: string; department?: string; imageUrl?: string }>
  ) => {
    setImporting(true)
    for (const link of links) {
      await saveProfessor({
        searchId: sid,
        name: link.name,
        profileUrl: link.url,
        title: link.title,
        department: link.department,
        imageUrl: link.imageUrl
      })
    }
    setImporting(false)
    fetchProfessors(sid)
  }

  const handleAddProfessor = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveProfessor({ searchId: sid, ...addForm })
    setAddForm({ name: '', profileUrl: '', email: '' })
    setShowAddForm(false)
  }

  if (loading && professors.length === 0) return <PageLoading />

  return (
    <div>
      <PageHeader
        title={search?.universityName || 'Professors'}
        description={
          search
            ? `Keywords: ${search.keywords} · ${professors.length} professor${professors.length !== 1 ? 's' : ''}`
            : undefined
        }
        backTo="/search"
        action={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            <UserPlus className="h-4 w-4" />
            Add Professor
          </button>
        }
      />

      {importing && (
        <div className="card p-4 mb-4 flex items-center gap-3 bg-blue-50 border-blue-200">
          <LoadingSpinner className="h-5 w-5" />
          <span className="text-sm text-blue-700">
            Importing professors from scraped data...
          </span>
        </div>
      )}

      {showAddForm && (
        <div className="card p-6 mb-6">
          <form onSubmit={handleAddProfessor} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  className="input"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Prof. John Doe"
                  required
                />
              </div>
              <div>
                <label className="label">Profile URL</label>
                <input
                  type="url"
                  className="input"
                  value={addForm.profileUrl}
                  onChange={(e) =>
                    setAddForm((prev) => ({
                      ...prev,
                      profileUrl: e.target.value
                    }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="john@university.edu"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {professors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No professors yet"
          description="Add professors manually or provide a department URL when creating a search to auto-discover them."
          action={
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              <UserPlus className="h-4 w-4" />
              Add Professor
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {professors.map((prof) => (
            <ProfessorCard
              key={prof.id}
              professor={prof}
              onDelete={() => deleteProfessor(prof.id)}
              onClick={() => navigate(`/professor/${prof.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProfessorCard({
  professor,
  onDelete,
  onClick
}: {
  professor: Professor
  onDelete: () => void
  onClick: () => void
}) {
  return (
    <div
      className="card p-4 flex items-center gap-4 hover:border-primary-200 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {professor.imageUrl ? (
        <img
          src={professor.imageUrl}
          alt={professor.name}
          className="h-12 w-12 rounded-full object-cover bg-gray-100"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
          {professor.name.charAt(0)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">
            {professor.name}
          </h3>
          <RelevanceBadge score={professor.relevanceScore} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
          {professor.title && <span>{professor.title}</span>}
          {professor.department && <span>{professor.department}</span>}
          {professor.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {professor.email}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {professor.profileUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.api.openExternal(professor.profileUrl!)
            }}
            className="btn-ghost p-1.5"
            title="Open profile"
          >
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="btn-ghost p-1.5"
          title="Remove"
        >
          <Trash2 className="h-4 w-4 text-gray-400" />
        </button>
        <ChevronRight className="h-5 w-5 text-gray-300" />
      </div>
    </div>
  )
}
