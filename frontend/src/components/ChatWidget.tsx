import React, { useEffect, useRef, useState } from 'react';
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
import { sendChatMessage } from '../services/api';
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
  const [focused, setFocused] = useState(false);

  const [messages, setMessages] = useState<ChatMessageModel[]>([
    {
      id: createMessageId(),
      role: 'assistant',
      content:
        'Hello! Ask me anything about Somali National University admission procedures.',
    },
  ]);

  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
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

  const handleSend = async () => {
    const text = input.trim();

    if (!text || loading) return;

    const userMsg: ChatMessageModel = {
      id: createMessageId(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const data = await sendChatMessage(text, conversationId);

      if (data?.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const botMsg: ChatMessageModel = {
        id: createMessageId(),
        role: 'assistant',
        content:
          data?.answer || 'No response received from the assistant.',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Error connecting to server.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open SNU Admission Assistant"
          className="
            flex items-center gap-2.5
            rounded-full
            bg-[#002147]
            px-5 py-3.5
            text-sm font-semibold text-white
            shadow-[0_10px_35px_rgba(0,33,71,0.28)]
            transition-all duration-200
            hover:scale-[1.03]
            hover:bg-[#001a39]
            active:scale-[0.98]
          "
        >
          <MessageSquare className="h-5 w-5 text-[#418FDE]" />

          <span>Ask Assistant</span>
        </button>
      ) : (
        <div
          className="
            flex flex-col overflow-hidden
            rounded-2xl
            border border-gray-200
            bg-white
            shadow-[0_20px_60px_rgba(0,0,0,0.18)]
            
            w-[calc(100vw-2rem)]
            sm:w-[420px]
            md:w-[440px]

            h-[calc(100vh-2rem)]
            sm:h-[650px]
            md:h-[680px]
          "
        >
          {/* Header */}
          <div
            className="
              flex shrink-0 items-center justify-between
              bg-[#002147]
              px-5 py-4
              text-white
            "
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <MessageSquare className="h-5 w-5 text-[#418FDE]" />
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
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="
                rounded-lg p-2
                text-white/60
                transition-colors
                hover:bg-white/10
                hover:text-white
              "
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messageContainerRef}
            className="
              flex-1
              overflow-y-auto
              bg-[#F8FAFC]
              px-4 py-5
              sm:px-5
              space-y-5
            "
          >
            {messages.map((message) => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`
                      flex
                      max-w-[90%]
                      items-start
                      gap-3
                      ${isUser ? 'flex-row-reverse' : 'flex-row'}
                    `}
                  >
                    {/* Avatar */}
                    <div
                      className={`
                        mt-1
                        flex
                        h-9 w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        ${
                          isUser
                            ? 'bg-[#418FDE] text-white'
                            : 'bg-[#002147] text-white'
                        }
                      `}
                    >
                      {isUser ? (
                        <UserRound className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4 text-[#418FDE]" />
                      )}
                    </div>

                    {/* Message */}
                    <div
                      className={`
                        rounded-2xl
                        px-4 py-3
                        text-[13px]
                        leading-relaxed
                        shadow-sm
                        ${
                          isUser
                            ? 'rounded-tr-md border border-[#418FDE] bg-[#418FDE] text-white'
                            : 'rounded-tl-md border border-gray-200 bg-white text-[#002147]'
                        }
                      `}
                    >
                      <div
                        className={`
                          mb-1.5
                          flex items-center gap-1.5
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.12em]
                          ${
                            isUser
                              ? 'text-white/75'
                              : 'text-[#002147]/60'
                          }
                        `}
                      >
                        <span>{isUser ? 'You' : 'Assistant'}</span>

                        {!isUser && (
                          <Sparkles className="h-3 w-3 text-[#418FDE]" />
                        )}
                      </div>

                      <div
                        className="
                          prose
                          prose-sm
                          max-w-none
                          break-words
                          [&_p]:my-1
                          [&_ul]:my-2
                          [&_ol]:my-2
                          [&_li]:my-0.5
                          [&_strong]:font-semibold
                        "
                      >
                        {isUser ? (
                          <span className="whitespace-pre-wrap">
                            {message.content}
                          </span>
                        ) : (
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#002147]">
                    <Bot className="h-4 w-4 text-[#418FDE]" />
                  </div>

                  <div className="rounded-2xl rounded-tl-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin text-[#418FDE]" />

                      <span className="text-xs font-medium text-[#002147]/70">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center text-xs text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4">
            <div
              className={`
                flex
                items-center
                gap-2
                rounded-2xl
                border
                bg-gray-50
                px-3.5 py-2.5
                transition-all
                ${
                  focused
                    ? 'border-[#418FDE] bg-white ring-2 ring-[#418FDE]/15'
                    : 'border-gray-200'
                }
              `}
            >
              <MessageCircleMore className="h-5 w-5 shrink-0 text-[#418FDE]" />

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();

                    if (!loading && input.trim()) {
                      handleSend();
                    }
                  }
                }}
                placeholder="Ask about admissions..."
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  px-1
                  py-1
                  text-sm
                  text-[#002147]
                  outline-none
                  placeholder:text-gray-400
                "
                disabled={loading}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="
                  flex
                  h-9 w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#418FDE]
                  text-white
                  shadow-sm
                  transition-all
                  hover:bg-[#2f76b9]
                  hover:shadow-md
                  disabled:cursor-not-allowed
                  disabled:bg-gray-300
                "
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
        </div>
      )}
    </div>
  );
};