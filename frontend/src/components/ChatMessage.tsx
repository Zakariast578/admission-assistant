import { Bot, Sparkles, UserRound } from 'lucide-react';
import type { ChatMessageModel } from '../types/index';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: ChatMessageModel;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[88%] items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
          {isUser ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className={`rounded-2xl border px-3.5 py-2.5 shadow-sm ${isUser ? 'border-blue-500 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`}>
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
            {isUser ? 'You' : 'Assistant'}
            {!isUser && <Sparkles className="h-3 w-3 text-amber-500" />}
          </div>
          
          <div className="text-xs leading-relaxed space-y-2">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-1.5 last:mb-0 text-gray-800">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-800">{children}</li>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}