import React, { useCallback, useEffect, useState } from 'react';
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

type HealthStatus = HealthCheckResponse['status'];

interface StatusConfig {
  label: string;
  colorClass: string;
  backgroundClass: string;
  dotClass: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const STATUS_CONFIG: Record<'loading' | HealthStatus, StatusConfig> = {
  loading: {
    label: 'Checking',
    colorClass: 'text-white/70',
    backgroundClass: 'border-white/10 bg-white/[0.06]',
    dotClass: 'animate-pulse bg-white/50',
    icon: Clock3,
  },

  ok: {
    label: 'System Online',
    colorClass: 'text-emerald-400',
    backgroundClass: 'border-emerald-400/20 bg-emerald-400/10',
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]',
    icon: Wifi,
  },

  degraded: {
    label: 'Degraded',
    colorClass: 'text-amber-400',
    backgroundClass: 'border-amber-400/20 bg-amber-400/10',
    dotClass: 'bg-amber-400',
    icon: WifiOff,
  },

  offline: {
    label: 'Offline',
    colorClass: 'text-red-400',
    backgroundClass: 'border-red-400/20 bg-red-400/10',
    dotClass: 'bg-red-400',
    icon: WifiOff,
  },
};

const getStatusConfig = (
  loading: boolean,
  health: HealthCheckResponse | null,
): StatusConfig => {
  if (loading) {
    return STATUS_CONFIG.loading;
  }

  if (health?.status === 'ok') {
    return STATUS_CONFIG.ok;
  }

  if (health?.status === 'degraded') {
    return STATUS_CONFIG.degraded;
  }

  return STATUS_CONFIG.offline;
};

interface HeaderStatusProps {
  config: StatusConfig;
}

function HeaderStatus({ config }: HeaderStatusProps) {
  const Icon = config.icon;

  return (
    <div
      className={[
        'flex shrink-0 items-center gap-2 rounded-full border',
        'px-3 py-1.5 backdrop-blur-md',
        'transition-colors duration-200',
        'sm:gap-2.5 sm:px-3.5 sm:py-2',
        config.backgroundClass,
      ].join(' ')}
      aria-live="polite"
      aria-label={`System status: ${config.label}`}
      role="status"
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${config.colorClass}`}
        aria-hidden="true"
      />

      <div className="hidden sm:block">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">
          System
        </p>

        <p className={`text-xs font-semibold ${config.colorClass}`}>
          {config.label}
        </p>
      </div>

      <span
        className={`h-2 w-2 shrink-0 rounded-full ${config.dotClass}`}
        aria-hidden="true"
      />
    </div>
  );
}

interface KnowledgeTrustBarProps {
  isLoaded: boolean;
}

function KnowledgeTrustBar({ isLoaded }: KnowledgeTrustBarProps) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2.5 sm:px-4 sm:py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-accent)]/12">
        <ShieldCheck
          className="h-4 w-4 text-[var(--color-brand-accent)]"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-white sm:text-sm">
          Secure contextual admissions assistance
        </p>

        <p className="mt-0.5 truncate text-[11px] leading-5 text-white/55 sm:text-xs">
          Responses are generated from the connected university knowledge base.
        </p>
      </div>

      <KnowledgeBaseStatus isLoaded={isLoaded} />
    </div>
  );
}

interface KnowledgeBaseStatusProps {
  isLoaded: boolean;
}

function KnowledgeBaseStatus({ isLoaded }: KnowledgeBaseStatusProps) {
  const Icon = isLoaded ? CheckCircle2 : Activity;

  return (
    <div className="hidden shrink-0 items-center gap-2 md:flex">
      <div className="h-6 w-px bg-white/10" />

      <div className="flex items-center gap-1.5">
        <Icon
          className={`h-4 w-4 ${
            isLoaded ? 'text-emerald-400' : 'text-amber-400'
          }`}
          aria-hidden="true"
        />

        <span className="text-xs font-medium text-white/65">
          Knowledge Base
        </span>

        <span
          className={[
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            isLoaded
              ? 'bg-emerald-400/10 text-emerald-400'
              : 'bg-amber-400/10 text-amber-400',
          ].join(' ')}
        >
          {isLoaded ? 'Ready' : 'Loading'}
        </span>
      </div>
    </div>
  );
}

interface MobileStatusFooterProps {
  isLoaded: boolean;
  environment: string;
}

function MobileStatusFooter({
  isLoaded,
  environment,
}: MobileStatusFooterProps) {
  return (
    <div className="mt-3 flex items-center justify-between gap-4 md:hidden">
      <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
        <span className="text-white/45">Knowledge Base</span>
        <span className="text-white/20" aria-hidden="true">
          •
        </span>
        <span
          className={
            isLoaded
              ? 'font-medium text-emerald-400'
              : 'font-medium text-amber-400'
          }
        >
          {isLoaded ? 'Ready' : 'Loading'}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 text-[11px]">
        <span className="text-white/45">Environment</span>

        <span className="font-medium capitalize text-white/65">
          {environment}
        </span>
      </div>
    </div>
  );
}

export function Header() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealthStatus = useCallback(async (active: boolean) => {
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
  }, []);

  useEffect(() => {
    let active = true;

    void loadHealthStatus(active);

    return () => {
      active = false;
    };
  }, [loadHealthStatus]);

  const statusConfig = getStatusConfig(loading, health);
  const isKnowledgeBaseLoaded = health?.index_loaded ?? false;
  const environment = health?.environment ?? 'unknown';

  return (
    <header
      className="
        relative overflow-hidden
        border-b border-[var(--color-border-muted)]
        bg-[var(--color-deep-navy)]
        text-[var(--color-surface-white)]
        shadow-md
      "
    >
      {/* Decorative background accents */}
      <div
        className="
          pointer-events-none absolute -right-24 -top-28
          h-64 w-64 rounded-full
          bg-[var(--color-brand-accent)]/12
          blur-3xl
        "
        aria-hidden="true"
      />

      <div
        className="
          pointer-events-none absolute -bottom-40 left-1/3
          h-72 w-72 rounded-full
          bg-[var(--color-brand-accent)]/5
          blur-3xl
        "
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div
              className="
                flex h-10 w-10 shrink-0 items-center justify-center
                rounded-xl border border-white/10
                bg-white/[0.05]
                sm:h-12 sm:w-12
              "
              aria-hidden="true"
            >
              <BrainCircuit
                className="
                  h-5 w-5 text-[var(--color-brand-accent)]
                  sm:h-6 sm:w-6
                "
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)] sm:text-[11px]">
                  SNU Admission Assistant
                </p>

                <span
                  className="
                    hidden h-1.5 w-1.5 shrink-0 rounded-full
                    bg-[var(--color-brand-accent)]
                    shadow-[0_0_8px_var(--color-brand-accent)]
                    sm:block
                  "
                  aria-hidden="true"
                />
              </div>

              <h1 className="mt-0.5 truncate text-base font-semibold tracking-tight text-white sm:text-lg">
                Intelligent Admission Guidance
              </h1>

              <p className="mt-0.5 hidden text-xs leading-5 text-white/55 sm:block">
                AI-powered answers from the university knowledge base
              </p>
            </div>
          </div>

          {/* System status */}
          <HeaderStatus config={statusConfig} />
        </div>

        <KnowledgeTrustBar isLoaded={isKnowledgeBaseLoaded} />

        <MobileStatusFooter
          isLoaded={isKnowledgeBaseLoaded}
          environment={environment}
        />
      </div>
    </header>
  );
}