import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-primary-600 ${className}`} />
}

export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <LoadingSpinner className="h-8 w-8" />
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  )
}
