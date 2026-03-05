import { Sparkles } from 'lucide-react'

interface AISummaryProps {
  summary: string
}

export function AISummary({ summary }: AISummaryProps) {
  if (!summary) {
    return null
  }

  return (
    <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Sparkles className="h-5 w-5 text-purple-600" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <h3 className="text-sm font-medium text-purple-800">
            Ukentlig innsikt (AI-generert)
          </h3>
          <div className="mt-2 text-sm text-purple-700">
            <p className="break-words">{summary}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
