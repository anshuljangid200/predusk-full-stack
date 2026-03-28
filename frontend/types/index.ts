export interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_stage?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobResult {
  id: string;
  document_id: string;
  title?: string;
  category?: string;
  summary?: string;
  keywords?: string[];
  extracted_metadata?: Record<string, any>;
  is_finalized: boolean;
  raw_output?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface JobDetail {
  document: Document;
  result?: JobResult;
}

export interface ProgressEvent {
  stage: string;
  progress: number;
  message: string;
  timestamp: string;
}

export interface JobsListResponse {
  items: Document[];
  total: number;
  page: number;
  pages: number;
}

export interface UploadResponse extends Document {}
