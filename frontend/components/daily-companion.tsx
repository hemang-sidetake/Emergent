'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CompanionAlert, CompanionState } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Bell, AlertCircle, CheckCircle2, ListChecks } from 'lucide-react';

const STATE_STYLES: Record<
  CompanionState,
  { dot: string; border: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  silent: {
    dot: 'bg-state-silent',
    border: 'border-rule dark:border-dark-border',
    bg: 'bg-transparent',
    icon: CheckCircle2
  },
  attention: {
    dot: 'bg-state-attention',
    border: 'border-l-2 border-l-state-attention border-y-rule border-r-rule dark:border-y-dark-border dark:border-r-dark-border',
    bg: 'bg-transparent',
    icon: Bell
  },
  escalation: {
    dot: 'bg-state-escalation',
    border: 'border border-state-escalation/40',
    bg: 'bg-state-escalation/8 dark:bg-state-escalation/12',
    icon: AlertCircle
  },
  decision: {
    dot: 'bg-state-decision',
    border: 'border border-state-decision/40',
    bg: 'bg-state-decision/8 dark:bg-state-decision/12',
    icon: ListChecks
  }
};

interface Props {
  founderName: string;
  refreshKey?: number; // bump to refetch
}

export function DailyCompanion({ founderName, refreshKey = 0 }: Props) {
  const [alerts, setAlerts] = useState<CompanionAlert[]>([]);
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    setNow(
      new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    );
    api
      .companion()
      .then((d) => setAlerts(d.alerts))
      .catch(() => setAlerts([{ state: 'silent', title: 'Standby', body: 'Loading signals…' }]));
  }, [refreshKey]);

  return (
    <aside
      className="hidden lg:flex w-[340px] xl:w-[380px] flex-col border-l border-rule dark:border-dark-border bg-paper/40 dark:bg-dark-card/40 backdrop-blur-xl h-screen sticky top-0 px-7 py-10"
      data-testid="daily-companion"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="dateline text-muted">Companion</p>
          <p className="font-heading text-2xl font-medium mt-1">{founderName}'s desk</p>
        </div>
        <div className="text-right">
          <p className="dateline text-muted">Local</p>
          <p className="font-sans font-medium text-lg tabular-nums">{now}</p>
        </div>
      </div>

      <div className="hairline mb-6" />

      <p className="dateline text-muted mb-4">Signals</p>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 -mr-1">
        <AnimatePresence initial={false}>
          {alerts.map((a, i) => {
            const s = STATE_STYLES[a.state];
            const Icon = s.icon;
            return (
              <motion.div
                key={`${a.state}-${i}-${a.title}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={cn(
                  'px-4 py-3.5 rounded-sm transition-all',
                  s.border,
                  s.bg
                )}
                data-testid={`companion-alert-${a.state}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      s.dot,
                      a.state === 'escalation' && 'animate-pulse-soft'
                    )}
                  />
                  <Icon className="h-3.5 w-3.5 text-muted" />
                  <p className="dateline text-muted">{a.title}</p>
                </div>
                <p className="font-reading text-sm leading-snug text-ink dark:text-dark-fg">
                  {a.body}
                </p>
                {a.cta && a.state === 'decision' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      className="font-sans text-xs px-3 py-1.5 border border-ink dark:border-dark-fg hover:bg-ink hover:text-paper dark:hover:bg-dark-fg dark:hover:text-dark-bg transition-colors"
                      data-testid={`companion-cta-confirm-${i}`}
                    >
                      {a.cta}
                    </button>
                    <button
                      className="font-sans text-xs px-3 py-1.5 text-muted hover:text-ink dark:hover:text-dark-fg transition-colors"
                      data-testid={`companion-cta-defer-${i}`}
                    >
                      Defer
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {alerts.length === 0 && (
          <div className="text-muted italic text-sm font-reading">
            All clear. Companion will speak when it matters.
          </div>
        )}
      </div>

      <div className="hairline my-6" />
      <div className="space-y-1">
        <p className="dateline text-muted">Press ⌘K</p>
        <p className="font-reading text-sm text-ink/70 dark:text-dark-fg/70 italic">
          Open the Demo Console to modify inputs.
        </p>
      </div>
    </aside>
  );
}
