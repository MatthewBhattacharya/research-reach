import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProfessorStore } from '../stores/professorStore'
import { useProfileStore } from '../stores/profileStore'
import { useEmailStore } from '../stores/emailStore'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoading, LoadingSpinner } from '../components/ui/LoadingSpinner'
import { RichEditor } from '../components/email/RichEditor'
import {
  Sparkles,
  Send,
  Save,
  Copy,
  CheckCircle,
  BookOpen,
  AlertCircle
} from 'lucide-react'

export function EmailComposerPage() {
  const { professorId } = useParams<{ professorId: string }>()
  const navigate = useNavigate()
  const pid = parseInt(professorId || '0')

  const {
    currentProfessor: professor,
    papers,
    fetchProfessor,
    fetchPapers
  } = useProfessorStore()
  const { profile, fetchProfile } = useProfileStore()
  const { generating, saveEmail, generateEmail } = useEmailStore()

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [greeting, setGreeting] = useState('')
  const [signoff, setSignoff] = useState('')
  const [workPeriod, setWorkPeriod] = useState('')
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<number>>(new Set())
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [noApiKey, setNoApiKey] = useState(false)

  useEffect(() => {
    fetchProfile()
    if (pid) {
      fetchProfessor(pid)
      fetchPapers(pid)
    }
  }, [pid, fetchProfessor, fetchPapers, fetchProfile])

  useEffect(() => {
    if (professor) {
      setGreeting(`Dear ${professor.title || 'Professor'} ${professor.name},`)
      setSubject(
        `Research Opportunity Inquiry - ${profile?.researchInterests?.split(',')[0]?.trim() || 'Your Research'}`
      )
    }
    if (profile) {
      setSignoff(
        `Best regards,\n${profile.name}\n${profile.university || ''}\n${profile.email || ''}`
      )
    }
  }, [professor, profile])

  const togglePaper = (id: number) => {
    setSelectedPaperIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleGenerate = async () => {
    if (!professor || !profile) return

    const selectedPapers = papers
      .filter((p) => selectedPaperIds.has(p.id))
      .map((p) => ({
        title: p.title,
        year: p.year,
        abstract: p.abstract,
        aiSummary: p.aiSummary
      }))

    const result = await generateEmail({
      professorName: professor.name,
      professorTitle: professor.title,
      professorDepartment: professor.department,
      university: professor.department, // TODO: get from search
      researchSummary: professor.researchSummary,
      selectedPapers,
      userName: profile.name,
      userEmail: profile.email,
      userUniversity: profile.university,
      userDepartment: profile.department,
      userResearchInterests: profile.researchInterests,
      userCvText: profile.cvText,
      workPeriod: workPeriod || 'Summer 2026'
    })

    if (result) {
      setBody(result)
    } else {
      setNoApiKey(true)
    }
  }

  const handleSave = async () => {
    const fullBody = `${greeting}\n\n${body}\n\n${signoff}`
    await saveEmail({
      professorId: pid,
      subject,
      body: fullBody,
      recipientEmail: professor?.email,
      status: 'draft',
      workPeriod,
      selectedPapers: JSON.stringify([...selectedPaperIds])
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopyToClipboard = () => {
    const fullBody = `${greeting}\n\n${body}\n\n${signoff}`
    const plainText = fullBody.replace(/<[^>]+>/g, '')
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${plainText}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!professor) return <PageLoading />

  return (
    <div>
      <PageHeader
        title={`Email to ${professor.name}`}
        description={professor.email || 'No email on file'}
        backTo={`/professor/${pid}`}
      />

      {noApiKey && (
        <div className="card p-4 mb-4 flex items-center gap-3 bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            AI generation failed. Make sure you've added your API key in{' '}
            <button
              onClick={() => navigate('/settings')}
              className="underline font-medium"
            >
              Settings
            </button>
            .
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Paper selection */}
        <div className="col-span-1">
          <div className="card p-4 sticky top-6">
            <h3 className="font-medium text-gray-900 text-sm mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Select Papers to Reference
            </h3>
            {papers.length === 0 ? (
              <p className="text-xs text-gray-500">
                No papers found. Go back and scrape the professor's profile or
                Google Scholar first.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {papers.map((paper) => (
                  <label
                    key={paper.id}
                    className={`flex items-start gap-2 rounded-lg p-2 cursor-pointer transition-colors text-xs ${
                      selectedPaperIds.has(paper.id)
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPaperIds.has(paper.id)}
                      onChange={() => togglePaper(paper.id)}
                      className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {paper.title}
                      </p>
                      {paper.year && (
                        <span className="text-gray-400">{paper.year}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-4">
              <label className="label text-xs">Work Period</label>
              <input
                type="text"
                className="input text-xs"
                value={workPeriod}
                onChange={(e) => setWorkPeriod(e.target.value)}
                placeholder="e.g. Summer 2026"
              />
            </div>

            <button
              onClick={handleGenerate}
              className="btn-primary w-full mt-4 text-xs"
              disabled={generating}
            >
              {generating ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Email editor */}
        <div className="col-span-2 space-y-4">
          <div className="card p-4">
            <label className="label">Subject</label>
            <input
              type="text"
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
            />
          </div>

          <div className="card p-4">
            <label className="label">Greeting</label>
            <input
              type="text"
              className="input mb-4"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Dear Professor..."
            />

            <label className="label">Body</label>
            <RichEditor
              content={body}
              onChange={setBody}
              placeholder="Write your email body here, or use AI to generate a draft..."
            />

            <label className="label mt-4">Sign-off</label>
            <textarea
              className="input text-sm"
              value={signoff}
              onChange={(e) => setSignoff(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={handleCopyToClipboard} className="btn-secondary">
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              {saved ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Draft
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
