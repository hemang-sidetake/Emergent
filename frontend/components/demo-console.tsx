'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { InputsBundle, Overrides } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Command, X, RotateCw, Zap, Eye, ChevronRight } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onRegenerate: (overrides: Overrides, useLlm: boolean) => Promise<void>;
  isRegenerating: boolean;
}

type Scenario = {
  id: string;
  label: string;
  description: string;
  overrides: Overrides;
};

const SCENARIOS: Scenario[] = [
  {
    id: 'baseline',
    label: 'Baseline — Tuesday morning',
    description: 'Default inputs. Demo target output.',
    overrides: {}
  },
  {
    id: 'bharat-replied',
    label: 'You already replied to Bharat',
    description: 'Removes the Lightspeed email. Watch the brief reorder.',
    overrides: { inbox: [{ op: 'remove', id: 'email-1' }] }
  },
  {
    id: 'new-fire',
    label: 'A new fire just landed',
    description: 'Tier-1 investor demands a meeting today.',
    overrides: {
      inbox: [
        {
          op: 'add',
          id: 'email-fire',
          from: 'Sequoia Capital',
          fromCategory: 'investor',
          subject: 'Quick call this afternoon?',
          snippet:
            'Heard the bridge round is heating up. Got 30 min today before 6pm? Need to move fast.',
          receivedAt: '20 minutes ago',
          ageHours: 0,
          unanswered: true,
          investorTier: 1
        }
      ]
    }
  },
  {
    id: 'ananya-resigned',
    label: 'Ananya escalates further',
    description: 'High-heat DM gets more urgent.',
    overrides: {
      slack: [
        {
          op: 'patch',
          id: 'slack-1',
          text: "I've drafted my resignation. Let's talk before 11."
        }
      ]
    }
  },
  {
    id: 'cancel-pr-already',
    label: "You've cancelled Vox PR already",
    description: 'Frees the cancel slot. New cancel candidate surfaces.',
    overrides: { calendar: [{ op: 'remove', id: 'cal-4' }] }
  }
];

export function DemoConsole({ open, onClose, onRegenerate, isRegenerating }: Props) {
  const [inputs, setInputs] = useState<InputsBundle | null>(null);
  const [selected, setSelected] = useState<string>('baseline');
  const [tab, setTab] = useState<'scenarios' | 'inputs'>('scenarios');

  useEffect(() => {
    if (open && !inputs) api.inputs().then(setInputs).catch(() => null);
  }, [open, inputs]);

  // Cmd/Ctrl + K shortcut + Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleRun = async (s: Scenario) => {
    setSelected(s.id);
    await onRegenerate(s.overrides, true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          data-testid="demo-console"
        >
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            aria-label="Close console"
            data-testid="demo-console-backdrop"
          />

          <motion.div
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-console relative w-full max-w-3xl rounded-md shadow-2xl text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Command className="h-4 w-4 text-white/60" />
                <p className="font-sans text-xs uppercase tracking-[0.22em] text-white/60">
                  Demo Console
                </p>
                <span className="text-white/30">·</span>
                <p className="font-sans text-xs text-white/40">For judges & live demo</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
                data-testid="demo-console-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3 border-b border-white/10">
              {(['scenarios', 'inputs'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'font-sans text-xs uppercase tracking-[0.18em] px-3 py-2 transition-colors',
                    tab === t
                      ? 'text-white border-b border-white -mb-px'
                      : 'text-white/40 hover:text-white/80'
                  )}
                  data-testid={`demo-console-tab-${t}`}
                >
                  {t === 'scenarios' ? 'Scenarios' : 'Live Inputs'}
                </button>
              ))}
              <div className="flex-1" />
              {isRegenerating && (
                <div className="flex items-center gap-2 text-white/60 font-sans text-xs">
                  <RotateCw className="h-3 w-3 animate-spin" />
                  Regenerating…
                </div>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto p-5">
              {tab === 'scenarios' && (
                <div className="space-y-2">
                  <p className="font-sans text-xs text-white/40 mb-3">
                    Pick a scenario. Brief regenerates with Claude Sonnet 4.5 in real time.
                  </p>
                  {SCENARIOS.map((s) => {
                    const isActive = selected === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleRun(s)}
                        disabled={isRegenerating}
                        className={cn(
                          'w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left transition-all border rounded-sm',
                          isActive
                            ? 'border-ember/60 bg-ember/10'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5',
                          isRegenerating && 'opacity-50 cursor-wait'
                        )}
                        data-testid={`demo-scenario-${s.id}`}
                      >
                        <div className="min-w-0">
                          <p className="font-sans font-medium text-sm text-white">{s.label}</p>
                          <p className="font-sans text-xs text-white/50 mt-0.5">
                            {s.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-white/50">
                          {isActive ? (
                            <Zap className="h-4 w-4 text-ember" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {tab === 'inputs' && (
                <div className="space-y-5">
                  {inputs ? (
                    <>
                      <InputSection
                        label="Calendar (today)"
                        items={inputs.calendar.map((e) => `${e.time} · ${e.title}`)}
                      />
                      <InputSection
                        label="Inbox (last 48h)"
                        items={inputs.inbox.map((e) => `${e.from} — ${e.subject}`)}
                      />
                      <InputSection
                        label="Slack"
                        items={inputs.slack.map((e) => `${e.from} in ${e.channel}: ${e.text.slice(0, 60)}`)}
                      />
                      <InputSection
                        label="Open loops"
                        items={inputs.openLoops.map((e) => `${e.item} — ${e.lastTouched}`)}
                      />
                    </>
                  ) : (
                    <p className="font-sans text-xs text-white/40">Loading inputs…</p>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/30">
                ⌘K to toggle · ESC to close
              </p>
              <div className="flex items-center gap-2 text-white/40">
                <Eye className="h-3 w-3" />
                <p className="font-sans text-[10px] uppercase tracking-[0.22em]">
                  Claude Sonnet 4.5
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InputSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/40 mb-2">
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className="font-sans text-xs text-white/70 border-l border-white/15 pl-3 leading-snug"
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
