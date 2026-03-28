import { Document, JobResult, JobDetail, JobsListResponse, UploadResponse } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function uploadDocuments(files: File[]): Promise<UploadResponse[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Upload failed');
  }

  return res.json();
}

export async function getJobs(params: Record<string, any>): Promise<JobsListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, value.toString());
    }
  });

  const res = await fetch(`${API_BASE}/jobs?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  
  return res.json();
}

export async function getJob(id: string): Promise<JobDetail> {
  const res = await fetch(`${API_BASE}/jobs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch job details');
  
  return res.json();
}

export async function updateResult(id: string, data: Partial<JobResult>): Promise<JobResult> {
  const res = await fetch(`${API_BASE}/jobs/${id}/result`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error('Failed to update result');
  return res.json();
}

export async function finalizeResult(id: string): Promise<JobResult> {
  const res = await fetch(`${API_BASE}/jobs/${id}/finalize`, {
    method: 'POST',
  });
  
  if (!res.ok) throw new Error('Failed to finalize result');
  return res.json();
}

export async function retryJob(id: string): Promise<Document> {
  const res = await fetch(`${API_BASE}/jobs/${id}/retry`, {
    method: 'POST',
  });
  
  if (!res.ok) throw new Error('Failed to retry job');
  return res.json();
}

export async function exportJob(id: string, format: 'json' | 'csv'): Promise<void> {
  window.open(`${API_BASE}/jobs/${id}/export?format=${format}`, '_blank');
}
