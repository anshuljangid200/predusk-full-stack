'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getJob, retryJob } from '@/lib/api';
import { JobDetail } from '@/types';
import ProgressBar from '@/components/ProgressBar';
import ResultEditor from '@/components/ResultEditor';
import ExportButton from '@/components/ExportButton';
import Link from 'next/link';
import { Loader2, ArrowLeft, RefreshCw, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await getJob(params.id);
      setData(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load job';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryJob(params.id);
      toast.success('Job queued for retry');
      await fetchJob();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Retry failed';
      toast.error(msg);
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Job Not Found</h2>
        <Link href="/dashboard" className="text-blue-600 hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const { document, result } = data;
  const isProcessingOrQueued = document.status === 'queued' || document.status === 'processing';
  const isCompleted = document.status === 'completed';
  const isFailed = document.status === 'failed';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 transition flex items-center space-x-1">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <h1
              className="text-lg font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md"
              title={document.filename}
            >
              {document.filename}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border capitalize
                ${document.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                ${document.status === 'failed' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                ${isProcessingOrQueued ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
              `}
            >
              {document.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Metadata Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">Document Details</h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Type</p>
                  <p className="font-medium text-gray-900 uppercase">{document.file_type}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Size</p>
                  <p className="font-medium text-gray-900">{(document.file_size / 1024).toFixed(1)} KB</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Added</p>
                  <p className="font-medium text-gray-900">{new Date(document.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Retries</p>
                  <p className="font-medium text-gray-900">{document.retry_count}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Processing State */}
        {isProcessingOrQueued && (
          <ProgressBar documentId={document.id} onComplete={fetchJob} />
        )}

        {/* Failed State */}
        {isFailed && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm">
            <div className="flex items-start space-x-3 mb-4 sm:mb-0">
              <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-semibold mb-1">Processing Failed</h3>
                <p className="text-red-600 text-sm max-w-xl">
                  {document.error_message || 'An unknown error occurred during processing.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>Retry Job</span>
            </button>
          </div>
        )}

        {/* Results Editor */}
        {isCompleted && result && (
          <div className="space-y-6">
            <ResultEditor result={result} documentId={document.id} onUpdate={fetchJob} />
            {result.is_finalized && <ExportButton documentId={document.id} />}
          </div>
        )}
      </main>
    </div>
  );
}
