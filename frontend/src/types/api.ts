export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
}

export interface ChatResponse {
  answer: string;
}

export interface HealthCheckResponse {
  status: string;
  environment: string;
  llm_provider: string;
  index_loaded: boolean;
  version?: string;
}

export interface ChatMessageModel {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
