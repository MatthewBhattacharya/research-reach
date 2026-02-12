interface RelevanceBadgeProps {
  score: number | null | undefined
}

export function RelevanceBadge({ score }: RelevanceBadgeProps) {
  if (score == null) return null

  const pct = Math.round(score * 100)
  let colorClass: string

  if (pct >= 80) {
    colorClass = 'bg-green-100 text-green-800'
  } else if (pct >= 60) {
    colorClass = 'bg-blue-100 text-blue-800'
  } else if (pct >= 40) {
    colorClass = 'bg-yellow-100 text-yellow-800'
  } else {
    colorClass = 'bg-gray-100 text-gray-600'
  }

  return (
    <span className={`badge ${colorClass}`}>
      {pct}% match
    </span>
  )
}
