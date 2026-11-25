import React from 'react'
import { FolderOpen } from 'lucide-react'

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'Try adjusting your filters or add a new record to get started.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="text-xs font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3.5 h-8 inline-flex items-center justify-center px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
