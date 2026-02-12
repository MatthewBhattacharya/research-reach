import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProfessorStore } from '../stores/professorStore'
import { useProfileStore } from '../stores/profileStore'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoading, LoadingSpinner } from '../components/ui/LoadingSpinner'
import { RelevanceBadge } from '../components/ui/RelevanceBadge'
import {
  Mail,
  ExternalLink,
  FileText,
  Users,
  Download,
  Sparkles,
  RefreshCw,
  Trash2,
  BookOpen,
  GraduationCap,
  Globe
} from 'lucide-react'

export function ProfessorDetailPage() {
  const { professorId } = useParams<{ professorId: string }>()
  const navigate = useNavigate()
  const {
    currentProfessor: professor,
    papers,
    contacts,
    loading,
    fetchProfessor,
    fetchPapers,
    fetchContacts,
    savePaper,
    deletePaper,
    saveContact,
    deleteContact,
    scrapeProfessor,
    scrapeScholar
  } = useProfessorStore()
  const { profile } = useProfileStore()

  const [scrapingProfile, setScrapingProfile] = useState(false)
  const [scrapingScholar, setScrapingScholar] = useState(false)
  const [activeTab, setActiveTab] = useState<'papers' | 'contacts' | 'info'>('papers')

  const pid = parseInt(professorId || '0')

  useEffect(() => {
    if (pid) {
      fetchProfessor(pid)
      fetchPapers(pid)
      fetchContacts(pid)
    }
  }, [pid, fetchProfessor, fetchPapers, fetchContacts])

  const handleScrapeProfile = async () => {
    if (!professor?.profileUrl) return
    setScrapingProfile(true)
    const result = await scrapeProfessor(professor.profileUrl) as any
    if (result?.success && result.data) {
      const data = result.data
      // Update professor with scraped data
      const { saveProfessor } = useProfessorStore.getState()
      await saveProfessor({
        id: professor.id,
        email: data.email || professor.email,
        title: data.title || professor.title,
        department: data.department || professor.department,
        researchSummary: data.researchSummary || professor.researchSummary,
        imageUrl: data.imageUrl || professor.imageUrl
      })

      // Add discovered publications
      if (data.publications) {
        for (const pub of data.publications) {
          await savePaper({
            professorId: pid,
            title: pub.title,
            authors: pub.authors,
            year: pub.year,
            url: pub.url,
            source: 'Faculty page'
          })
        }
      }

      // Add lab members
      if (data.labMembers) {
        for (const member of data.labMembers) {
          await saveContact({
            professorId: pid,
            name: member.name,
            role: member.role,
            email: member.email,
            profileUrl: member.url
          })
        }
      }

      fetchProfessor(pid)
      fetchPapers(pid)
      fetchContacts(pid)
    }
    setScrapingProfile(false)
  }

  const handleScrapeScholar = async () => {
    if (!professor?.name) return
    setScrapingScholar(true)
    const result = await scrapeScholar(professor.name) as any
    if (result?.success && result.data?.papers) {
      for (const paper of result.data.papers) {
        await savePaper({
          professorId: pid,
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          url: paper.url,
          abstract: paper.abstract,
          source: 'Google Scholar'
        })
      }
      fetchPapers(pid)
    }
    setScrapingScholar(false)
  }

  if (loading && !professor) return <PageLoading />
  if (!professor) return <PageLoading message="Professor not found" />

  const tabs = [
    { id: 'papers' as const, label: 'Papers', count: papers.length },
    { id: 'contacts' as const, label: 'Lab Members', count: contacts.length },
    { id: 'info' as const, label: 'Info', count: null }
  ]

  return (
    <div>
      <PageHeader
        title={professor.name}
        description={
          [professor.title, professor.department].filter(Boolean).join(' · ') ||
          undefined
        }
        backTo={
          professor.searchId
            ? `/search/${professor.searchId}/professors`
            : '/search'
        }
        action={
          <button
            onClick={() => navigate(`/professor/${pid}/email`)}
            className="btn-primary"
          >
            <Mail className="h-4 w-4" />
            Draft Email
          </button>
        }
      />

      {/* Professor overview card */}
      <div className="card p-6 mb-6">
        <div className="flex gap-5">
          {professor.imageUrl ? (
            <img
              src={professor.imageUrl}
              alt={professor.name}
              className="h-20 w-20 rounded-xl object-cover bg-gray-100"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="h-20 w-20 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold shrink-0">
              {professor.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <RelevanceBadge score={professor.relevanceScore} />
              {professor.email && (
                <span className="badge-blue">
                  <Mail className="h-3 w-3 mr-1" />
                  {professor.email}
                </span>
              )}
            </div>

            {professor.researchSummary && (
              <p className="text-sm text-gray-600 line-clamp-3">
                {professor.researchSummary}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              {professor.profileUrl && (
                <button
                  onClick={handleScrapeProfile}
                  className="btn-secondary text-xs py-1 px-2"
                  disabled={scrapingProfile}
                >
                  {scrapingProfile ? (
                    <LoadingSpinner className="h-3 w-3" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  Scrape Profile
                </button>
              )}
              <button
                onClick={handleScrapeScholar}
                className="btn-secondary text-xs py-1 px-2"
                disabled={scrapingScholar}
              >
                {scrapingScholar ? (
                  <LoadingSpinner className="h-3 w-3" />
                ) : (
                  <GraduationCap className="h-3 w-3" />
                )}
                Find on Scholar
              </button>
              {professor.profileUrl && (
                <button
                  onClick={() =>
                    window.api.openExternal(professor.profileUrl!)
                  }
                  className="btn-secondary text-xs py-1 px-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-xs text-gray-400">
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'papers' && (
        <div className="space-y-3">
          {papers.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No papers found. Use "Scrape Profile" or "Find on Scholar" to discover papers.
            </div>
          ) : (
            papers.map((paper) => (
              <div key={paper.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
                      <h4 className="font-medium text-gray-900 text-sm">
                        {paper.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {paper.authors && (
                        <span className="truncate">{paper.authors}</span>
                      )}
                      {paper.year && <span>{paper.year}</span>}
                      {paper.source && (
                        <span className="badge-gray text-xs">{paper.source}</span>
                      )}
                      <RelevanceBadge score={paper.relevanceScore} />
                    </div>
                    {paper.abstract && (
                      <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                        {paper.abstract}
                      </p>
                    )}
                    {paper.aiSummary && (
                      <p className="mt-2 text-xs text-primary-700 bg-primary-50 rounded p-2">
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        {paper.aiSummary}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {paper.url && (
                      <button
                        onClick={() => window.api.openExternal(paper.url!)}
                        className="btn-ghost p-1"
                        title="Open paper"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => deletePaper(paper.id)}
                      className="btn-ghost p-1"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No lab members found. Use "Scrape Profile" to discover lab members.
            </div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="card p-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {contact.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {contact.role && <span>{contact.role}</span>}
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.isRecommendedContact && (
                      <span className="badge-green text-xs">Recommended</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteContact(contact.id)}
                  className="btn-ghost p-1"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="label">Name</span>
              <p className="text-gray-900">{professor.name}</p>
            </div>
            <div>
              <span className="label">Title</span>
              <p className="text-gray-900">{professor.title || '—'}</p>
            </div>
            <div>
              <span className="label">Department</span>
              <p className="text-gray-900">{professor.department || '—'}</p>
            </div>
            <div>
              <span className="label">Email</span>
              <p className="text-gray-900">{professor.email || '—'}</p>
            </div>
            <div className="col-span-2">
              <span className="label">Profile URL</span>
              {professor.profileUrl ? (
                <button
                  onClick={() =>
                    window.api.openExternal(professor.profileUrl!)
                  }
                  className="flex items-center gap-1 text-primary-600 hover:underline text-sm"
                >
                  <Globe className="h-3 w-3" />
                  {professor.profileUrl}
                </button>
              ) : (
                <p className="text-gray-900">—</p>
              )}
            </div>
            <div className="col-span-2">
              <span className="label">Research Summary</span>
              <p className="text-gray-900 text-xs leading-relaxed whitespace-pre-wrap">
                {professor.researchSummary || '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
