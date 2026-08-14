import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MessageSquare,
  X,
  ArrowUp,
  LoaderCircle,
  MessageCircleMore,
  Bot,
  Sparkles,
  UserRound,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { streamChatMessage } from '../services/api';
import type { ChatMessageModel } from '../types/index';

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

function createMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ----------------------------------------------------------------------
// MAIN CHAT WIDGET COMPONENT
// ----------------------------------------------------------------------

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessageModel[]>([
    {
      id: createMessageId(),
      role: 'assistant',
      content: 'Hello! Ask me anything about Somali National University admission procedures.',
    },
  ]);

  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages or streaming tokens
  useEffect(() => {
    if (!isOpen) return;

    const container = messageContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading, isOpen]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessageModel = {
      id: createMessageId(),
      role: 'user',
      content: text,
    };

    const assistantMsgId = createMessageId();
    const botMsgPlaceholder: ChatMessageModel = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMsg, botMsgPlaceholder]);
    setInput('');
    setLoading(true);
    setError(null);

    await streamChatMessage(text, conversationId, {
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + token }
              : msg
          )
        );
      },
      onComplete: (data) => {
        if (data?.conversation_id) {
          setConversationId(data.conversation_id);
        }
        setLoading(false);
      },
      onError: (err) => {
        setError(err.message || 'Error connecting to streaming server.');
        setLoading(false);
      },
    });
  }, [input, loading, conversationId]);

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans sm:bottom-6 sm:right-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open SNU Admission Assistant"
          className="flex items-center gap-2.5 rounded-full bg-[var(--color-deep-navy)] px-5 py-3.5 text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:scale-[1.03] hover:bg-[#001733] active:scale-[0.98]"
        >
          <MessageSquare className="h-5 w-5 text-[var(--color-brand-accent)]" />
          <span>Ask Assistant</span>
        </button>
      ) : (
        <div className="flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:h-[650px] sm:w-[420px] md:h-[680px] md:w-[440px]">
          {/* Widget Header */}
          <ChatHeader onClose={() => setIsOpen(false)} />

          {/* Messages Stream View */}
          <MessageList
            messages={messages}
            error={error}
            containerRef={messageContainerRef}
          />

          {/* User Input Composer */}
          <ChatInput
            input={input}
            loading={loading}
            onChange={setInput}
            onSend={handleSend}
          />
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

interface ChatHeaderProps {
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => (
  <div className="flex shrink-0 items-center justify-between bg-[var(--color-deep-navy)] px-5 py-4 text-white">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
        <MessageSquare className="h-5 w-5 text-[var(--color-brand-accent)]" />
      </div>

      <div>
        <div className="text-sm font-semibold tracking-wide">
          SNU Admission Assistant
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/65">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Online
        </div>
      </div>
    </div>

    <button
      onClick={onClose}
      aria-label="Close chat"
      className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
    >
      <X className="h-5 w-5" />
    </button>
  </div>
);

interface MessageListProps {
  messages: ChatMessageModel[];
  error: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  error,
  containerRef,
}) => (
  <div
    ref={containerRef}
    className="flex-1 space-y-5 overflow-y-auto bg-[#F8FAFC] px-4 py-5 sm:px-5"
  >
    {messages.map((message) => {
      const isUser = message.role === 'user';

      return (
        <div
          key={message.id}
          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`flex max-w-[90%] items-start gap-3 ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isUser
                  ? 'bg-[var(--color-brand-accent)] text-white'
                  : 'bg-[var(--color-deep-navy)] text-white'
              }`}
            >
              {isUser ? (
                <UserRound className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4 text-[var(--color-brand-accent)]" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                isUser
                  ? 'rounded-tr-md bg-[var(--color-brand-accent)] text-white'
                  : 'rounded-tl-md border border-gray-200 bg-white text-[var(--color-deep-navy)]'
              }`}
            >
              <div
                className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  isUser ? 'text-white/80' : 'text-[var(--color-deep-navy)]/60'
                }`}
              >
                <span>{isUser ? 'You' : 'Assistant'}</span>
                {!isUser && (
                  <Sparkles className="h-3 w-3 text-[var(--color-brand-accent)]" />
                )}
              </div>

              <div className="prose prose-sm max-w-none break-words [&_li]:my-0.5 [&_ol]:my-2 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:my-2">
                {isUser ? (
                  <span className="whitespace-pre-wrap">{message.content}</span>
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}

    {error && (
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-xs text-red-700">
        {error}
      </div>
    )}
  </div>
);

interface ChatInputProps {
  input: string;
  loading: boolean;
  onChange: (val: string) => void;
  onSend: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  loading,
  onChange,
  onSend,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4">
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-gray-50 px-3.5 py-2.5 transition-all ${
          focused
            ? 'border-[var(--color-brand-accent)] bg-white ring-2 ring-[var(--color-brand-accent)]/15'
            : 'border-gray-200'
        }`}
      >
        <MessageCircleMore className="h-5 w-5 shrink-0 text-[var(--color-brand-accent)]" />

        <input
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!loading && input.trim()) {
                onSend();
              }
            }
          }}
          placeholder="Ask about admissions..."
          className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm text-[var(--color-deep-navy)] outline-none placeholder:text-gray-400"
          disabled={loading}
        />

        <button
          type="button"
          onClick={onSend}
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-accent)] text-white shadow-sm transition-all hover:opacity-95 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="mt-2 text-center text-[10px] text-gray-400">
        SNU Admission Assistant
      </p>
    </div>
  );
};