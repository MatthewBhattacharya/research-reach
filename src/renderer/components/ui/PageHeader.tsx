interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  backTo?: string
}

import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({ title, description, action, backTo }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-6">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
