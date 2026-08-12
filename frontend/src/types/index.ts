export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreate {
  title?: string;
}

export interface ConversationUpdate {
  title: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface MessageCreate {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MessageUpdate {
  content: string;
}