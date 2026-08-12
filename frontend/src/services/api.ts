import type { DocumentItem, HealthCheckResponse } from '../types/index';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export interface ChatResponse {
  conversation_id: string;
  answer: string;
}

interface BackendDocument {
  id: string;
  title?: string;
  category?: string;
  file_name: string;
  status: string;
  upload_date: string;
}

interface BackendUploadResponse {
  message: string;
  id: string;
  filename: string;
  status: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const parsedError = JSON.parse(errorText);
      if (parsedError.detail) {
        errorMessage = typeof parsedError.detail === 'string' ? parsedError.detail : JSON.stringify(parsedError.detail);
      }
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// HEALTH CHECK
export async function fetchHealthStatus(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse<HealthCheckResponse>(response);
}

// CHAT ENDPOINT
export async function sendChatMessage(
  message: string,
  conversationId: string | null = null
): Promise<ChatResponse> {
  const sanitizedMessage = message.trim();
  if (!sanitizedMessage) {
    throw new Error('Message cannot be empty');
  }

  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: sanitizedMessage,
      conversation_id: conversationId,
    }),
  });

  return handleResponse<ChatResponse>(response);
}

// DOCUMENTS ENDPOINTS
export async function fetchDocuments(): Promise<DocumentItem[]> {
  const response = await fetch(`${API_BASE}/documents/`);
  const documents = await handleResponse<BackendDocument[]>(response);

  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title || doc.file_name.replace(/\.[^.]+$/, ''),
    category: doc.category || 'General',
    file_name: doc.file_name,
    upload_date: doc.upload_date || new Date().toISOString().slice(0, 10),
  }));
}

export async function uploadDocument(file: File, category: string): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  const uploadResult = await handleResponse<BackendUploadResponse>(response);

  return {
    id: uploadResult.id,
    title: uploadResult.filename.replace(/\.[^.]+$/, ''),
    category: category || 'General',
    file_name: uploadResult.filename,
    upload_date: new Date().toISOString().slice(0, 10),
  };
}

export async function deleteDocument(docId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(response);
}