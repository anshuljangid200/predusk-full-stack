'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ProgressEvent } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ProgressBar({ documentId, onComplete }: { documentId: string; onComplete: () => void }) {
  const [event, setEvent] = useState<ProgressEvent>({
    stage: 'connecting',
    progress: 0,
    message: 'Establishing connection...',
    timestamp: new Date().toISOString(),
  });

  const handleComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      source = new EventSource(`${API_BASE}/progress/${documentId}`);

      source.onmessage = (e) => {
        try {
          const data: ProgressEvent = JSON.parse(e.data);
          setEvent(data);

          if (
            data.stage === 'job_completed' ||
            data.stage === 'job_failed' ||
            data.stage === 'completed' ||
            data.stage === 'failed'
          ) {
            source?.close();
            setTimeout(() => {
              handleComplete();
            }, 1000);
          }
        } catch (err) {
          console.error('Failed to parse SSE', err);
        }
      };

      source.onerror = () => {
        source?.close();
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      source?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [documentId, handleComplete]);

  return (
    <div className="w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-800 capitalize">{event.stage.replace(/_/g, ' ')}</h4>
        <span className="text-blue-600 font-bold">{event.progress}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${event.progress}%` }}
        />
      </div>

      <p className="text-sm text-gray-500 italic">{event.message}</p>
    </div>
  );
}
