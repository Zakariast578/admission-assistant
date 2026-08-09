import { Bot, Sparkles, UserRound } from 'lucide-react';
import type { ChatMessageModel } from '../types/api';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: ChatMessageModel;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[88%] items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${isUser ? 'bg-[#418FDE] text-white' : 'bg-[#F2F2F2] text-[#002147]'}`}>
          {isUser ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className={`rounded-3xl border px-4 py-3 shadow-sm ${isUser ? 'border-[#418FDE]/20 bg-[#418FDE] text-white' : 'border-[#DADADA] bg-white text-[#002147]'}`}>
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] opacity-70">
            {isUser ? 'You' : 'Assistant'}
            {!isUser && <Sparkles className="h-3.5 w-3.5" />}
          </div>
          
          <div className="text-sm leading-6 prose prose-slate max-w-none">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}