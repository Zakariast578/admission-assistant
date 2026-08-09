import { Activity, BrainCircuit, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchHealthStatus } from '../services/api';
import type { HealthCheckResponse } from '../types/api';

interface HeaderProps {
  isOnline: boolean;
}

export function Header({ isOnline }: HeaderProps) {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const data = await fetchHealthStatus();
        if (active) {
          setHealth(data);
        }
      } catch {
        if (active) {
          setHealth({ status: 'degraded', environment: 'local', llm_provider: 'unknown', index_loaded: false });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const statusLabel = loading ? 'Checking…' : health?.status === 'ok' ? 'Live' : 'Offline';
  const badgeTone = loading || health?.status !== 'ok' ? 'bg-[#C62828]/10 text-[#C62828]' : 'bg-[#418FDE]/10 text-[#418FDE]';

  return (
    <header className="border-b border-[#DADADA] bg-[#002147] px-4 py-4 text-white shadow-sm sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5">
            <BrainCircuit className="h-5 w-5 text-[#418FDE]" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-[#418FDE] uppercase">Admission Assistant</p>
            <h1 className="text-lg font-semibold text-white">RAG guidance for applicants</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
          <Activity className={`h-4 w-4 ${isOnline ? 'text-[#418FDE]' : 'text-[#C62828]'}`} />
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeTone}`}>{statusLabel}</span>
          <span className="hidden text-sm text-white/80 sm:inline">Index {health?.index_loaded ? 'loaded' : 'pending'}</span>
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-5xl items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80">
        <ShieldCheck className="h-4 w-4 text-[#418FDE]" />
        <span>Secure, contextual admissions answers from the connected knowledge .</span>
      </div>
    </header>
  );
}
