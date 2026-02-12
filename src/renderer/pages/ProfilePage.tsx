import { useEffect, useState } from 'react'
import { useProfileStore } from '../stores/profileStore'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoading } from '../components/ui/LoadingSpinner'
import { FileText, Upload, Save, CheckCircle } from 'lucide-react'

export function ProfilePage() {
  const { profile, loading, fetchProfile, saveProfile } = useProfileStore()
  const [form, setForm] = useState({
    name: '',
    email: '',
    university: '',
    department: '',
    researchInterests: '',
    cvPath: '',
    cvText: ''
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        university: profile.university || '',
        department: profile.department || '',
        researchInterests: profile.researchInterests || '',
        cvPath: profile.cvPath || '',
        cvText: profile.cvText || ''
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCvUpload = async () => {
    const result = await window.api.selectFile([
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] }
    ])
    if (result) {
      setForm((prev) => ({
        ...prev,
        cvPath: result.path,
        cvText: result.content
      }))
    }
  }

  if (loading && !profile) return <PageLoading message="Loading profile..." />

  return (
    <div>
      <PageHeader
        title="Your Profile"
        description="Tell us about yourself so we can personalize your emails."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Jane Smith"
                required
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="jane@university.edu"
                required
              />
            </div>
            <div>
              <label className="label">University</label>
              <input
                type="text"
                className="input"
                value={form.university}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, university: e.target.value }))
                }
                placeholder="MIT"
              />
            </div>
            <div>
              <label className="label">Department</label>
              <input
                type="text"
                className="input"
                value={form.department}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, department: e.target.value }))
                }
                placeholder="Computer Science"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Research Interests
          </h2>
          <textarea
            className="input min-h-[120px]"
            value={form.researchInterests}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                researchInterests: e.target.value
              }))
            }
            placeholder="Describe your research interests, skills, and what kind of research you're looking to do. This helps us match you with relevant professors and generate personalized emails."
            rows={5}
          />
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            CV / Resume
          </h2>
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={handleCvUpload}
              className="btn-secondary"
            >
              <Upload className="h-4 w-4" />
              Upload CV
            </button>
            {form.cvPath && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span className="truncate max-w-xs">{form.cvPath}</span>
              </div>
            )}
          </div>
          {form.cvText && (
            <div className="mt-4">
              <label className="label">Extracted Text (editable)</label>
              <textarea
                className="input min-h-[100px] text-xs font-mono"
                value={form.cvText}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cvText: e.target.value }))
                }
                rows={6}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {saved ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
