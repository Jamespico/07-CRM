import React from 'react'

export function KPICardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-4 w-4 bg-slate-200 rounded" />
      </div>
      <div className="mt-3">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-100 rounded mt-2" />
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs animate-pulse flex flex-col justify-between">
      <div className="space-y-1.5 mb-4">
        <div className="h-3.5 w-32 bg-slate-200 rounded" />
        <div className="h-2.5 w-48 bg-slate-100 rounded" />
      </div>
      <div className="h-56 w-full bg-slate-50 rounded border border-slate-100 flex items-end justify-between p-4 gap-2">
        <div className="w-full bg-slate-200/60 rounded-t h-[40%]" />
        <div className="w-full bg-slate-200/60 rounded-t h-[70%]" />
        <div className="w-full bg-slate-200/60 rounded-t h-[50%]" />
        <div className="w-full bg-slate-200/60 rounded-t h-[85%]" />
        <div className="w-full bg-slate-200/60 rounded-t h-[60%]" />
        <div className="w-full bg-slate-200/60 rounded-t h-[30%]" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-3 bg-slate-200 rounded w-4/5" />
        </td>
      ))}
    </tr>
  )
}

export function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-100/70 p-3 min-w-[210px] animate-pulse">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
        <div className="h-3.5 w-20 bg-slate-200 rounded" />
        <div className="h-4 w-6 bg-slate-200 rounded" />
      </div>
      <div className="space-y-2.5">
        <div className="h-24 bg-white rounded border border-slate-200 p-3 space-y-2">
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-2.5 w-20 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded pt-1" />
        </div>
        <div className="h-24 bg-white rounded border border-slate-200 p-3 space-y-2">
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-2.5 w-20 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded pt-1" />
        </div>
      </div>
    </div>
  )
}
