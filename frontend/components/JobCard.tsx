'use client';

import React from 'react';
import Link from 'next/link';
import { Document } from '../types';
import { FileText, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function JobCard({ job }: { job: Document }) {
  const statusColors = {
    queued: 'bg-gray-100 text-gray-700 border-gray-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusIcons = {
    queued: <Clock className="h-4 w-4" />,
    processing: <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4" />,
    failed: <AlertCircle className="h-4 w-4" />,
  };

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 h-full flex flex-col relative overflow-hidden">
        
        {job.status === 'processing' && (
          <div className="absolute top-0 left-0 h-1 bg-blue-100 w-full mb-4">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out" 
              style={{ width: `${job.progress}%` }} 
            />
          </div>
        )}

        <div className="flex justify-between items-start mb-3 pt-1">
          <div className="flex items-center space-x-2 min-w-0">
            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <h3 className="font-semibold text-gray-800 truncate" title={job.filename}>
              {job.filename}
            </h3>
          </div>
          <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[job.status]}`}>
            {statusIcons[job.status]}
            <span className="capitalize">{job.status}</span>
          </span>
        </div>

        <div className="mt-auto space-y-2 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Type: <span className="uppercase font-medium text-gray-700">{job.file_type}</span></span>
            <span>Size: {(job.file_size / 1024).toFixed(1)} KB</span>
          </div>
          <div className="text-xs text-gray-400 text-right">
            Added: {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString()}
          </div>
        </div>

      </div>
    </Link>
  );
}
