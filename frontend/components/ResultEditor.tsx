'use client';

import React, { useState, useCallback } from 'react';
import { JobResult } from '../types';
import { updateResult, finalizeResult } from '../lib/api';
import toast from 'react-hot-toast';
import { Loader2, Save, Lock, CheckCircle2, X } from 'lucide-react';

interface Props {
  result: JobResult;
  documentId: string;
  onUpdate: () => void;
}

const CATEGORIES = ['PDF Document', 'Text File', 'Word Document', 'Image', 'Spreadsheet', 'Unknown'];

export default function ResultEditor({ result, documentId, onUpdate }: Props) {
  const [formData, setFormData] = useState({
    title: result.title || '',
    category: result.category || 'Unknown',
    summary: result.summary || '',
    keywords: result.keywords || [] as string[],
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const isFinalized = result.is_finalized;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateResult(documentId, formData);
      toast.success('Result saved successfully');
      onUpdate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [documentId, formData, onUpdate]);

  const handleFinalize = useCallback(async () => {
    if (!confirm('Are you sure you want to finalize? This cannot be undone.')) return;
    setFinalizing(true);
    try {
      await finalizeResult(documentId);
      toast.success('Result finalized successfully');
      onUpdate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to finalize';
      toast.error(msg);
    } finally {
      setFinalizing(false);
    }
  }, [documentId, onUpdate]);

  const addKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (!formData.keywords.includes(keywordInput.trim())) {
        setFormData(prev => ({ ...prev, keywords: [...prev.keywords, keywordInput.trim()] }));
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (idx: number) => {
    setFormData(prev => ({ ...prev, keywords: prev.keywords.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Processing Results</h3>
        {isFinalized ? (
          <span className="flex items-center space-x-1.5 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>Finalized</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1.5 text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-sm font-medium">
            <Lock className="h-4 w-4" />
            <span>Draft</span>
          </span>
        )}
      </div>

      <div className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            disabled={isFinalized}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
            disabled={isFinalized}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-500"
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
          <textarea
            rows={4}
            value={formData.summary}
            onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
            disabled={isFinalized}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.keywords.map((kw, idx) => (
              <span key={idx} className="bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                <span>{kw}</span>
                {!isFinalized && (
                  <button onClick={() => removeKeyword(idx)} className="text-gray-400 hover:text-red-500 focus:outline-none">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {!isFinalized && (
            <input
              type="text"
              placeholder="Type keyword and press Enter"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={addKeyword}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          )}
        </div>
      </div>

      {!isFinalized && (
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving || finalizing}
            className="flex items-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Draft</span>
          </button>
          <button
            onClick={handleFinalize}
            disabled={saving || finalizing}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>Finalize Result</span>
          </button>
        </div>
      )}
    </div>
  );
}
