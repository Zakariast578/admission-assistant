import type { HealthCheckResponse } from '../types/index';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Checks backend health status and knowledge index state.
 */
export async function fetchHealthStatus(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }

  return response.json();
}

/**
 * Streaming chat message handler
 */
export async function streamChatMessage(
  message: string,
  conversationId: string | null,
  callbacks: {
    onToken: (token: string) => void;
    onComplete?: (data: { conversation_id?: string }) => void;
    onError?: (error: { message?: string }) => void;
  }
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const rawData = line.slice(6).trim();
          if (rawData === '[DONE]') continue;

          try {
            const parsed = JSON.parse(rawData);
            if (parsed.token) {
              callbacks.onToken(parsed.token);
            }
            if (parsed.conversation_id && callbacks.onComplete) {
              callbacks.onComplete({ conversation_id: parsed.conversation_id });
            }
          } catch {
            // Raw text fallback if backend streams non-JSON string chunks
            callbacks.onToken(rawData);
          }
        }
      }
    }

    if (callbacks.onComplete) {
      callbacks.onComplete({});
    }
  } catch (err: any) {
    if (callbacks.onError) {
      callbacks.onError({ message: err.message || 'Stream connection failed.' });
    }
  }
}

/**
 * Document endpoints
 */
export async function fetchDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`);
  if (!response.ok) throw new Error('Failed to fetch documents.');
  return response.json();
}

export async function uploadDocument(file: File, category: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Failed to upload document.');
  return response.json();
}

export async function deleteDocument(docId: string) {
  const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
    method: 'DELETE',
  });

  if (!response.ok) throw new Error('Failed to delete document.');
  return response.json();
}