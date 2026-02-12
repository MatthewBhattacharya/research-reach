import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmailStore, type Email } from '../stores/emailStore'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoading } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import {
  Mail,
  Trash2,
  Copy,
  CheckCircle,
  Clock,
  Send,
  FileText,
  Eye
} from 'lucide-react'
import { useState } from 'react'

export function EmailHistoryPage() {
  const navigate = useNavigate()
  const { emails, loading, fetchEmails, deleteEmail, updateStatus } =
    useEmailStore()
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const handleCopy = (email: Email) => {
    const plainText = email.body.replace(/<[^>]+>/g, '')
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${plainText}`)
    setCopiedId(email.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'sent':
        return <span className="badge-green"><Send className="h-3 w-3 mr-1" />Sent</span>
      case 'draft':
        return <span className="badge-yellow"><FileText className="h-3 w-3 mr-1" />Draft</span>
      default:
        return <span className="badge-gray">{status || 'unknown'}</span>
    }
  }

  if (loading && emails.length === 0) return <PageLoading />

  return (
    <div>
      <PageHeader
        title="Email History"
        description={`${emails.length} email${emails.length !== 1 ? 's' : ''}`}
      />

      {emails.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No emails yet"
          description="Draft emails will appear here. Go to a professor's page and click 'Draft Email' to get started."
        />
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <div key={email.id} className="card">
              <div className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(email.status)}
                    {email.recipientEmail && (
                      <span className="text-xs text-gray-500">
                        to {email.recipientEmail}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {email.subject}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {email.createdAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(email.createdAt).toLocaleDateString()}
                      </span>
                    )}
                    {email.sentAt && (
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        Sent {new Date(email.sentAt).toLocaleDateString()}
                      </span>
                    )}
                    {email.workPeriod && (
                      <span>Period: {email.workPeriod}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() =>
                      setViewingId(viewingId === email.id ? null : email.id)
                    }
                    className="btn-ghost p-1.5"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleCopy(email)}
                    className="btn-ghost p-1.5"
                    title="Copy"
                  >
                    {copiedId === email.id ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {email.status === 'draft' && (
                    <button
                      onClick={() => updateStatus(email.id, 'sent')}
                      className="btn-ghost p-1.5"
                      title="Mark as sent"
                    >
                      <Send className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteEmail(email.id)}
                    className="btn-ghost p-1.5"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {viewingId === email.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: email.body.replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
