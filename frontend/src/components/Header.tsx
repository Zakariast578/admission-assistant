import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
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
          setHealth({
            status: 'degraded',
            environment: 'local',
            llm_provider: 'unknown',
            index_loaded: false,
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const isOnline = health?.status === 'ok';
  const isDegraded = health?.status === 'degraded';

  const statusLabel = loading
    ? 'Checking'
    : isOnline
      ? 'System Online'
      : isDegraded
        ? 'Degraded'
        : 'Offline';

  const statusColor = loading
    ? 'text-white/70'
    : isOnline
      ? 'text-emerald-400'
      : isDegraded
        ? 'text-amber-400'
        : 'text-red-400';

  const statusBg = loading
    ? 'bg-white/10 border-white/10'
    : isOnline
      ? 'bg-emerald-400/10 border-emerald-400/20'
      : isDegraded
        ? 'bg-amber-400/10 border-amber-400/20'
        : 'bg-red-400/10 border-red-400/20';

  return (
    <header
      className="
        relative
        overflow-hidden
        border-b
        border-[var(--color-border-muted)]
        bg-[var(--color-deep-navy)]
        text-[var(--color-surface-white)]
        shadow-lg
      "
    >
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--color-brand-accent)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[var(--color-brand-accent)]/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
            <div
              className="
                flex
                h-11 w-11
                shrink-0
                items-center justify-center
                rounded-2xl
                border border-white/15
                bg-white/10
                shadow-inner
                backdrop-blur-md
                sm:h-12 sm:w-12
              "
            >
              <BrainCircuit
                className="h-5.5 w-5.5 text-[var(--color-brand-accent)] sm:h-6 sm:w-6"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-brand-accent)] sm:text-[11px] sm:tracking-[0.24em]">
                  SNU Admission Assistant
                </p>

                <span className="hidden h-1.5 w-1.5 rounded-full bg-[var(--color-brand-accent)] shadow-[0_0_8px_var(--color-brand-accent)] sm:block" />
              </div>

              <h1 className="mt-1 truncate text-base font-semibold tracking-tight text-white sm:text-xl">
                Intelligent Admission Guidance
              </h1>

              <p className="mt-0.5 hidden text-xs text-white/55 sm:block">
                AI-powered answers from the university knowledge base
              </p>
            </div>
          </div>

          {/* System Status */}
          <div
            className={`
              flex
              shrink-0
              items-center
              gap-2
              rounded-full
              border
              px-2.5 py-2
              sm:gap-2.5
              sm:px-3.5
              ${statusBg}
              backdrop-blur-md
            `}
          >
            {loading ? (
              <Clock3 className="h-4 w-4 text-white/60" />
            ) : isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff
                className={`h-4 w-4 ${
                  isDegraded ? 'text-amber-400' : 'text-red-400'
                }`}
              />
            )}

            <div className="hidden sm:block">
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/40">
                System
              </p>
              <p className={`text-xs font-semibold ${statusColor}`}>
                {statusLabel}
              </p>
            </div>

            <span
              className={`h-2 w-2 rounded-full ${
                loading
                  ? 'animate-pulse bg-white/50'
                  : isOnline
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : isDegraded
                      ? 'bg-amber-400'
                      : 'bg-red-400'
              }`}
            />
          </div>
        </div>

        {/* Trust / Knowledge Base Bar */}
        <div
          className="
            mt-4
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-white/10
            bg-white/[0.06]
            px-3.5 py-3
            backdrop-blur-md
            sm:mt-5
            sm:px-4
          "
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-accent)]/10">
            <ShieldCheck className="h-4 w-4 text-[var(--color-brand-accent)]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white sm:text-sm">
              Secure contextual admissions assistance
            </p>

            <p className="mt-0.5 truncate text-[10px] text-white/50 sm:text-xs">
              Responses are generated from the connected university knowledge
              base.
            </p>
          </div>

          {/* Knowledge Base Status */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-1.5">
              {health?.index_loaded ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Activity className="h-4 w-4 text-amber-400" />
              )}

              <span className="text-xs font-medium text-white/65">
                Knowledge Base
              </span>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  health?.index_loaded
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'bg-amber-400/10 text-amber-400'
                }`}
              >
                {health?.index_loaded ? 'Ready' : 'Loading'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Status Row */}
        <div className="mt-3 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-1.5 text-[10px] text-white/45">
            <span>Knowledge Base</span>
            <span className="text-white/20">•</span>

            <span
              className={
                health?.index_loaded
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }
            >
              {health?.index_loaded ? 'Ready' : 'Loading'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <span>Environment</span>
            <span className="font-medium text-white/60">
              {health?.environment || 'unknown'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}