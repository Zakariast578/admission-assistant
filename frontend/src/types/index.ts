export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  environment: string;
  llm_provider: string;
  index_loaded: boolean;
}

export interface DocumentItem {
  id: string;
  file_name: string;
  category: string;
  upload_date: string;
  file_size?: number;
  content_type?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete?: (data: { conversation_id?: string }) => void;
  onError?: (error: { message?: string }) => void;
}