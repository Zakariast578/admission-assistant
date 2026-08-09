import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { sendChatMessage } from './services/api';
import type { ChatMessageModel } from './types/api';

const starterMessages: ChatMessageModel[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Hello! I can help you explore admission requirements, deadlines, and scholarship guidance. Ask me anything about the process.',
    timestamp: new Date().toISOString(),
  },
];

function App() {
  const [messages, setMessages] = useState<ChatMessageModel[]>(starterMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const statusSummary = useMemo(() => {
    if (error) {
      return 'Connection issue';
    }
    if (isLoading) {
      return 'Assistant is thinking…';
    }
    return 'Ready to answer';
  }, [error, isLoading]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessageModel = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);
    setIsOnline(true);

    try {
      const response = await sendChatMessage(trimmed);
      const assistantMessage: ChatMessageModel = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setIsOnline(false);
      setError(err instanceof Error ? err.message : 'Unable to reach the admissions assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-[#002147]">
      <Header isOnline={isOnline} />

      <main className="mx-auto flex max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-4 rounded-[28px] border border-[#DADADA] bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#418FDE]">Live assistant</p>
              <h2 className="mt-1 text-xl font-semibold text-[#002147]">Ask for admissions clarity in plain language</h2>
            </div>
            <div className="rounded-full border border-[#DADADA] bg-[#F2F2F2] px-3 py-2 text-sm text-[#727272]">
              {statusSummary}
            </div>
          </div>
        </section>

        <section className="flex-1 overflow-hidden rounded-[32px] border border-[#DADADA] bg-white shadow-[0_20px_60px_rgba(0,33,71,0.08)]">
          <div className="h-[60vh] overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(65,143,222,0.10),_transparent_35%)] p-4 sm:p-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex max-w-[88%] items-start gap-3">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#F2F2F2] text-[#002147]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="rounded-3xl border border-[#DADADA] bg-white px-4 py-3 shadow-sm">
                      <div className="mb-2 h-2.5 w-20 animate-pulse rounded-full bg-[#418FDE]/20" />
                      <div className="h-2.5 w-40 animate-pulse rounded-full bg-[#DADADA]" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-[#C62828]/25 bg-[#C62828]/10 px-3 py-3 text-sm text-[#C62828]">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={isLoading}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
