import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ArrowUp,
  Bot,
  LoaderCircle,
  MessageCircleMore,
  MessageSquare,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { streamChatMessage } from '../services/api';
import type { ChatMessageModel } from '../types/index';

function createMessageId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
      content:
        'Hello! Ask me anything about Somali National University admission procedures.',
    },
  ]);

  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const container = messageContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading, isOpen]);

  const handleSend = useCallback(async () => {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    const userMessage: ChatMessageModel = {
      id: createMessageId(),
      role: 'user',
      content: text,
    };

    const assistantMessageId = createMessageId();

    const assistantPlaceholder: ChatMessageModel = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      assistantPlaceholder,
    ]);

    setInput('');
    setLoading(true);
    setError(null);

    await streamChatMessage(text, conversationId, {
      onToken: (token) => {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: message.content + token,
                }
              : message,
          ),
        );
      },

      onComplete: (data) => {
        if (data?.conversation_id) {
          setConversationId(data.conversation_id);
        }

        setLoading(false);
      },

      onError: (err) => {
        setError(
          err.message || 'Error connecting to streaming server.',
        );
        setLoading(false);
      },
    });
  }, [conversationId, input, loading]);

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans sm:bottom-6 sm:right-6">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open SNU Admission Assistant Chat"
          className="
            inline-flex items-center gap-2.5
            rounded-full
            bg-[var(--color-deep-navy)]
            px-5 py-3.5
            text-sm font-semibold text-white
            shadow-lg
            transition-all duration-200
            hover:scale-[1.02]
            hover:bg-[var(--color-deep-navy-hover)]
            active:scale-[0.98]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--color-brand-accent)]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-white
          "
        >
          <MessageSquare
            className="h-5 w-5 text-[var(--color-brand-accent)]"
            aria-hidden="true"
          />

          <span>Ask Assistant</span>
        </button>
      ) : (
        <section
          role="dialog"
          aria-modal="false"
          aria-label="SNU Admission Assistant Chat Panel"
          className="
            flex flex-col overflow-hidden
            border border-slate-200
            bg-white
            shadow-2xl
            transition-all duration-200

            h-[calc(100dvh-1rem)]
            w-[calc(100vw-1rem)]
            rounded-2xl

            sm:h-[650px]
            sm:w-[420px]
            sm:rounded-2xl

            md:h-[680px]
            md:w-[440px]
          "
        >
          <ChatHeader onClose={() => setIsOpen(false)} />

          <MessageList
            messages={messages}
            error={error}
            loading={loading}
            containerRef={messageContainerRef}
          />

          <ChatInput
            input={input}
            loading={loading}
            onChange={setInput}
            onSend={handleSend}
          />
        </section>
      )}
    </div>
  );
};

interface ChatHeaderProps {
  onClose: () => void;
}

function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <header
      className="
        relative flex shrink-0 items-center justify-between
        border-b border-white/10
        bg-[var(--color-deep-navy)]
        px-4 py-3.5
        text-white
        sm:px-5 sm:py-4
      "
    >
      <div
        className="
          pointer-events-none absolute inset-x-0 bottom-0 h-px
          bg-gradient-to-r
          from-transparent
          via-[var(--color-brand-accent)]/30
          to-transparent
        "
        aria-hidden="true"
      />

      <div className="flex min-w-0 items-center gap-3">
        <div
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-xl
            border border-white/10
            bg-white/[0.06]
          "
          aria-hidden="true"
        >
          <MessageSquare
            className="h-5 w-5 text-[var(--color-brand-accent)]"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight sm:text-[15px]">
            SNU Admission Assistant
          </h2>

          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="
                h-1.5 w-1.5 rounded-full
                bg-emerald-400
                shadow-[0_0_6px_rgba(52,211,153,0.6)]
              "
              aria-hidden="true"
            />

            <span className="text-[11px] font-medium text-white/65">
              Online
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close chat window"
        className="
          flex h-10 w-10 shrink-0 items-center justify-center
          rounded-xl
          text-white/65
          transition-colors duration-200
          hover:bg-white/10
          hover:text-white
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-white/70
        "
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </header>
  );
}

interface MessageListProps {
  messages: ChatMessageModel[];
  error: string | null;
  loading: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function MessageList({
  messages,
  error,
  loading,
  containerRef,
}: MessageListProps) {
  return (
    <div
      ref={containerRef}
      tabIndex={0}
      aria-label="Message history"
      aria-live="polite"
      aria-relevant="additions text"
      className="
        flex-1 overflow-y-auto
        bg-slate-50
        px-3.5 py-5
        sm:px-5
      "
    >
      <div className="space-y-5">
        {messages.map((message) => {
          const isUser = message.role === 'user';

          return (
            <ChatMessage
              key={message.id}
              message={message}
              isUser={isUser}
            />
          );
        })}

        {loading && <StreamingIndicator />}

        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: ChatMessageModel;
  isUser: boolean;
}

function ChatMessage({ message, isUser }: ChatMessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex max-w-[92%] items-start gap-2.5 sm:max-w-[88%] ${
          isUser ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className={`
            mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center
            rounded-lg
            ${
              isUser
                ? 'bg-[var(--color-brand-accent)] text-white'
                : 'border border-slate-200 bg-white text-[var(--color-brand-accent)]'
            }
          `}
          aria-hidden="true"
        >
          {isUser ? (
            <UserRound className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        <div
          className={`
            min-w-0 rounded-2xl px-4 py-3
            text-[13px] leading-6
            ${
              isUser
                ? 'rounded-tr-md bg-[var(--color-brand-accent)] text-white shadow-sm'
                : 'rounded-tl-md border border-slate-200 bg-white text-slate-800 shadow-sm'
            }
          `}
        >
          <div
            className={`
              mb-1.5 flex items-center gap-1.5
              text-[10px] font-bold uppercase tracking-[0.12em]
              ${isUser ? 'text-white/75' : 'text-slate-400'}
            `}
          >
            <span>{isUser ? 'You' : 'Assistant'}</span>

            {!isUser && (
              <Sparkles
                className="h-3 w-3 text-[var(--color-brand-accent)]"
                aria-hidden="true"
              />
            )}
          </div>

          <div
            className={`
              max-w-none break-words
              ${
                isUser
                  ? '[&_a]:underline [&_strong]:font-semibold'
                  : '[&_a]:font-medium [&_a]:text-[var(--color-brand-accent)] [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px] [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_strong]:font-semibold [&_ul]:my-2'
              }
            `}
          >
            {isUser ? (
              <span className="whitespace-pre-wrap">
                {message.content}
              </span>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StreamingIndicator() {
  return (
    <div
      className="flex items-start gap-2.5"
      role="status"
      aria-label="Assistant is typing"
    >
      <div
        className="
          flex h-8 w-8 shrink-0 items-center justify-center
          rounded-lg
          border border-slate-200
          bg-white
          text-[var(--color-brand-accent)]
        "
        aria-hidden="true"
      >
        <Bot className="h-4 w-4" />
      </div>

      <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="
        rounded-xl
        border border-red-200
        bg-red-50
        px-3.5 py-3
        text-xs
        leading-5
        text-red-700
      "
    >
      <p className="font-semibold">Unable to complete the request</p>

      <p className="mt-0.5 text-red-600/90">
        {message}
      </p>
    </div>
  );
}

interface ChatInputProps {
  input: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

function ChatInput({
  input,
  loading,
  onChange,
  onSend,
}: ChatInputProps) {
  const hasInput = input.trim().length > 0;

  return (
    <footer
      className="
        shrink-0
        border-t border-slate-200
        bg-white
        px-3.5 py-3
        sm:px-4 sm:py-3.5
      "
    >
      <div
        className="
          flex items-center gap-2
          rounded-xl
          border border-slate-200
          bg-slate-50
          px-3 py-1.5
          transition-all duration-200
          focus-within:border-[var(--color-brand-accent)]
          focus-within:bg-white
          focus-within:ring-2
          focus-within:ring-[var(--color-brand-accent)]/15
        "
      >
        <MessageCircleMore
          className="h-4 w-4 shrink-0 text-slate-400"
          aria-hidden="true"
        />

        <input
          type="text"
          value={input}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();

              if (!loading && hasInput) {
                onSend();
              }
            }
          }}
          placeholder="Ask about admissions..."
          disabled={loading}
          aria-label="Ask about admissions"
          className="
            min-w-0 flex-1
            bg-transparent
            px-1 py-2
            text-[13px]
            text-slate-800
            outline-none
            placeholder:text-slate-400
            disabled:cursor-not-allowed
            disabled:text-slate-400
          "
        />

        <button
          type="button"
          onClick={onSend}
          disabled={loading || !hasInput}
          aria-label={loading ? 'Sending message' : 'Send message'}
          className="
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-lg
            bg-[var(--color-brand-accent)]
            text-white
            shadow-sm
            transition-all duration-200
            hover:bg-[var(--color-brand-accent-hover)]
            active:scale-95
            disabled:cursor-not-allowed
            disabled:bg-slate-200
            disabled:text-slate-400
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--color-brand-accent)]
            focus-visible:ring-offset-1
          "
        >
          {loading ? (
            <LoaderCircle
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <ArrowUp
              className="h-4 w-4"
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      <p className="mt-2 text-center text-[10px] text-slate-400">
        SNU Admission AI Assistant
      </p>
    </footer>
  );
}