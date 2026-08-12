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
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
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
      content: 'Hello! Ask me anything about Somali National University admission procedures.',
    },
  ]);

  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    if (!isOpen) return;
    const container = messageContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
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

    // Optimistically add user message
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const data = await sendChatMessage(text, conversationId);

      if (data && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const botMsg: ChatMessageModel = {
        id: createMessageId(),
        role: 'assistant',
        content: data?.answer || 'No response received from assistant.',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : 'Error connecting to server.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#002147] hover:bg-[#001530] text-white px-5 py-3 rounded-full shadow-xl font-medium transition-all duration-200 hover:scale-105"
        >
          <MessageSquare className="w-5 h-5 text-[#418FDE]" />
          <span>Ask Assistant</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#002147] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#418FDE]" />
              <span className="font-semibold text-sm tracking-wide">
                SNU Admission Assistant
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={messageContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F9FAFB]"
          >
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[88%] items-start gap-2.5 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs ${
                        isUser
                          ? 'bg-[#418FDE] text-white'
                          : 'bg-[#002147] text-white'
                      }`}
                    >
                      {isUser ? (
                        <UserRound className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4 text-[#418FDE]" />
                      )}
                    </div>

                    <div
                      className={`rounded-2xl border px-3.5 py-2.5 shadow-sm text-xs ${
                        isUser
                          ? 'border-[#418FDE] bg-[#418FDE] text-white'
                          : 'border-gray-200 bg-white text-[#002147]'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-75">
                        {isUser ? 'You' : 'Assistant'}
                        {!isUser && <Sparkles className="h-3 w-3 text-[#418FDE]" />}
                      </div>

                      <div className="leading-relaxed whitespace-pre-wrap">
                        {isUser ? (
                          message.content
                        ) : (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex max-w-[88%] items-start gap-2.5">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#002147] text-white">
                    <Bot className="h-4 w-4 text-[#418FDE]" />
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm text-xs text-[#002147] flex items-center gap-2">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#418FDE]" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Display */}
            {error && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] text-center">
                {error}
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="border-t border-gray-200 bg-white px-3 py-3 shrink-0">
            <div
              className={`flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1.5 transition-all ${
                focused
                  ? 'border-[#418FDE] ring-2 ring-[#418FDE]/20 bg-white'
                  : 'border-gray-200'
              }`}
            >
              <MessageCircleMore className="h-4 w-4 text-[#418FDE] shrink-0" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && input.trim()) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about admissions..."
                className="flex-1 bg-transparent px-1 py-1 text-xs text-[#002147] outline-none placeholder:text-gray-400"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#418FDE] text-white transition-all hover:bg-[#2f76b9] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};