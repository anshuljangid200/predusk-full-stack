'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getJobs } from '@/lib/api';
import { JobsListResponse } from '@/types';
import JobCard from '@/components/JobCard';
import { Search, Plus, Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const TABS = ['all', 'queued', 'processing', 'completed', 'failed'];

export default function Dashboard() {
  const [data, setData] = useState<JobsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortParam, setSortParam] = useState('created_at-desc');
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(async () => {
    try {
      const [sortBy, sortDir] = sortParam.split('-');
      const res = await getJobs({
        search: searchTerm,
        status: statusFilter,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        page_size: 12,
      });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, sortParam, page]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => { fetchJobs(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  // Auto-refresh if ANY job is processing
  useEffect(() => {
    if (!data) return;
    const hasProcessing = data.items.some(j => j.status === 'processing');
    if (hasProcessing) {
      const intervalId = setInterval(fetchJobs, 15000);
      return () => clearInterval(intervalId);
    }
  }, [data, fetchJobs]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Processing Dashboard</h1>
          </div>
          <Link
            href="/"
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Upload More</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-8">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm"
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 w-full md:w-auto overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setStatusFilter(tab); setPage(1); }}
                className={`capitalize px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab
                    ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="w-full md:w-auto shrink-0 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <select
              value={sortParam}
              onChange={e => { setSortParam(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm bg-white cursor-pointer"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="filename-asc">Filename (A-Z)</option>
              <option value="filename-desc">Filename (Z-A)</option>
              <option value="status-asc">Status</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-32 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.items.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {data.pages > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Page {data.page} of {data.pages}
                </span>
                <button
                  disabled={page === data.pages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
