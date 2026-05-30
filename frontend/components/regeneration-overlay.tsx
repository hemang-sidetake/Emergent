'use client';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LINES = [
  'Reading the calendar…',
  'Scoring 47 signals across inbox, Slack, and calendar…',
  'Filtering items that need Priya herself…',
  'Drafting in her voice…',
  'Cutting until only four sections remain.'
];

export function RegenerationOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-paper/85 dark:bg-dark-bg/85 backdrop-blur-md flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="regeneration-overlay"
    >
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-3 mb-7">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="dateline text-primary">Regenerating brief</p>
        </div>
        <h2 className="font-heading font-light text-5xl leading-[0.95] tracking-tight mb-7 text-balance">
          A Chief of Staff is thinking.
        </h2>
        <ul className="space-y-2.5">
          {LINES.map((l, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.6, duration: 0.4 }}
              className="font-sans text-sm text-muted text-left"
            >
              <span className="text-primary/80 mr-2">›</span> {l}
            </motion.li>
          ))}
        </ul>
        <div className="mt-10 mx-auto h-px w-40 bg-rule dark:bg-dark-border relative overflow-hidden">
          <div className="absolute inset-y-0 w-1/3 bg-primary animate-scan" />
        </div>
      </div>
    </motion.div>
  );
}
