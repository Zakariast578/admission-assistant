import { Activity, BrainCircuit, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchHealthStatus } from '../services/api';
import type { HealthCheckResponse } from '../types/index';

export function Header() {
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

  const isOnline = health?.status === 'ok';
  const statusLabel = loading ? 'Checking…' : health?.status === 'ok' ? 'Live' : 'Offline';
  const badgeTone = loading || health?.status !== 'ok'
    ? 'bg-[var(--color-crimson-accent)]/10 text-[var(--color-crimson-accent)]'
    : 'bg-[var(--color-brand-accent)]/10 text-[var(--color-brand-accent)]';

  return (
    <header className="border-b border-[var(--color-border-muted)] bg-[var(--color-deep-navy)] px-4 py-4 text-[var(--color-surface-white)] shadow-sm sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5">
            <BrainCircuit className="h-5 w-5 text-[var(--color-brand-accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-[var(--color-brand-accent)] uppercase">Admission Assistant</p>
            <h1 className="text-lg font-semibold text-[var(--color-surface-white)]">RAG guidance for applicants</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
          <Activity className={`h-4 w-4 ${isOnline ? 'text-[var(--color-brand-accent)]' : 'text-[var(--color-crimson-accent)]'}`} />
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeTone}`}>{statusLabel}</span>
          <span className="hidden text-sm text-white/80 sm:inline">Index {health?.index_loaded ? 'loaded' : 'pending'}</span>
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-5xl items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80">
        <ShieldCheck className="h-4 w-4 text-[var(--color-brand-accent)]" />
        <span>Secure, contextual admissions answers from the connected knowledge base.</span>
      </div>
    </header>
  );
}