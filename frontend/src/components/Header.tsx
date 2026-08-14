import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { fetchHealthStatus } from '../services/api';
import type { HealthCheckResponse } from '../types/index';

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  dotBg: string;
  icon: React.ReactNode;
}

const getStatusConfig = (loading: boolean, health: HealthCheckResponse | null): StatusConfig => {
  if (loading) {
    return {
      label: 'Checking',
      color: 'text-white/70',
      bg: 'bg-white/10 border-white/10',
      dotBg: 'animate-pulse bg-white/50',
      icon: <Clock3 className="h-4 w-4 text-white/60" />,
    };
  }

  if (health?.status === 'ok') {
    return {
      label: 'System Online',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
      dotBg: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      icon: <Wifi className="h-4 w-4 text-emerald-400" />,
    };
  }

  if (health?.status === 'degraded') {
    return {
      label: 'Degraded',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10 border-amber-400/20',
      dotBg: 'bg-amber-400',
      icon: <WifiOff className="h-4 w-4 text-amber-400" />,
    };
  }

  return {
    label: 'Offline',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
    dotBg: 'bg-red-400',
    icon: <WifiOff className="h-4 w-4 text-red-400" />,
  };
};

// ----------------------------------------------------------------------
// MAIN HEADER COMPONENT
// ----------------------------------------------------------------------

export function Header() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealthStatus = useCallback(async (active: boolean) => {
    try {
      const data = await fetchHealthStatus();
      if (active) setHealth(data);
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
      if (active) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadHealthStatus(active);

    return () => {
      active = false;
    };
  }, [loadHealthStatus]);

  const statusConfig = getStatusConfig(loading, health);

  return (
    <header className="relative overflow-hidden border-b border-[var(--color-border-muted)] bg-[var(--color-deep-navy)] text-[var(--color-surface-white)] shadow-md">
      {/* Background radial ambient glow */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--color-brand-accent)]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[var(--color-brand-accent)]/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Brand & Identity */}
          <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner backdrop-blur-md sm:h-12 sm:w-12">
              <BrainCircuit className="h-5.5 w-5.5 text-[var(--color-brand-accent)] sm:h-6 sm:w-6" />
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

          {/* System Network Badge */}
          <div className={`flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-2 sm:gap-2.5 sm:px-3.5 ${statusConfig.bg} backdrop-blur-md transition-colors`}>
            {statusConfig.icon}

            <div className="hidden sm:block">
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/40">
                System
              </p>
              <p className={`text-xs font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </p>
            </div>

            <span className={`h-2 w-2 rounded-full ${statusConfig.dotBg}`} />
          </div>
        </div>

        {/* Knowledge Base Trust Indicator Bar */}
        <KnowledgeTrustBar isLoaded={health?.index_loaded ?? false} />

        {/* Mobile Context Footer */}
        <MobileStatusFooter
          isLoaded={health?.index_loaded ?? false}
          environment={health?.environment || 'unknown'}
        />
      </div>
    </header>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

interface KnowledgeTrustBarProps {
  isLoaded: boolean;
}

const KnowledgeTrustBar: React.FC<KnowledgeTrustBarProps> = ({ isLoaded }) => (
  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 backdrop-blur-md sm:mt-5 sm:px-4">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-accent)]/10">
      <ShieldCheck className="h-4 w-4 text-[var(--color-brand-accent)]" />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-white sm:text-sm">
        Secure contextual admissions assistance
      </p>

      <p className="mt-0.5 truncate text-[10px] text-white/50 sm:text-xs">
        Responses are generated from the connected university knowledge base.
      </p>
    </div>

    {/* Knowledge Base Connection Status (Desktop) */}
    <div className="hidden shrink-0 items-center gap-2 md:flex">
      <div className="h-8 w-px bg-white/10" />

      <div className="flex items-center gap-1.5">
        {isLoaded ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Activity className="h-4 w-4 text-amber-400" />
        )}

        <span className="text-xs font-medium text-white/65">
          Knowledge Base
        </span>

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isLoaded
              ? 'bg-emerald-400/10 text-emerald-400'
              : 'bg-amber-400/10 text-amber-400'
          }`}
        >
          {isLoaded ? 'Ready' : 'Loading'}
        </span>
      </div>
    </div>
  </div>
);

interface MobileStatusFooterProps {
  isLoaded: boolean;
  environment: string;
}

const MobileStatusFooter: React.FC<MobileStatusFooterProps> = ({ isLoaded, environment }) => (
  <div className="mt-3 flex items-center justify-between md:hidden">
    <div className="flex items-center gap-1.5 text-[10px] text-white/45">
      <span>Knowledge Base</span>
      <span className="text-white/20">•</span>
      <span className={isLoaded ? 'text-emerald-400' : 'text-amber-400'}>
        {isLoaded ? 'Ready' : 'Loading'}
      </span>
    </div>

    <div className="flex items-center gap-1.5 text-[10px] text-white/40">
      <span>Environment</span>
      <span className="font-medium text-white/60">
        {environment}
      </span>
    </div>
  </div>
);