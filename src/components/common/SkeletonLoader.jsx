import React from 'react';

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse space-y-4">
            <div className="h-40 bg-slate-200 rounded-xl skeleton-shimmer"></div>
            <div className="h-5 bg-slate-200 rounded w-3/4 skeleton-shimmer"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 skeleton-shimmer"></div>
            <div className="flex justify-between pt-2">
                <div className="h-6 bg-slate-200 rounded w-20 skeleton-shimmer"></div>
                <div className="h-6 bg-slate-200 rounded w-16 skeleton-shimmer"></div>
            </div>
        </div>
    );
}

export function StatSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-2/3">
                <div className="h-4 bg-slate-200 rounded w-1/2 skeleton-shimmer"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4 skeleton-shimmer"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 rounded-xl skeleton-shimmer"></div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg skeleton-shimmer"></div>
            ))}
        </div>
    );
}
