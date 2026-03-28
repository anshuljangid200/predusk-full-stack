'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportJob } from '../lib/api';

export default function ExportButton({ documentId }: { documentId: string }) {
  const [loadingJSON, setLoadingJSON] = useState(false);
  const [loadingCSV, setLoadingCSV] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    if (format === 'json') setLoadingJSON(true);
    else setLoadingCSV(true);
    
    try {
      await exportJob(documentId, format);
      // Let the browser handle the download link opening
    } finally {
      if (format === 'json') setLoadingJSON(false);
      else setLoadingCSV(false);
    }
  };

  return (
    <div className="flex space-x-3 mt-4">
      <button 
        onClick={() => handleExport('json')}
        disabled={loadingJSON}
        className="flex-1 flex items-center justify-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-70"
      >
        {loadingJSON ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span>Export JSON</span>
      </button>
      <button 
        onClick={() => handleExport('csv')}
        disabled={loadingCSV}
        className="flex-1 flex items-center justify-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-70"
      >
        {loadingCSV ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span>Export CSV</span>
      </button>
    </div>
  );
}
