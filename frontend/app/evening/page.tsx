'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { EveningClose } from '@/lib/types';
import { GlobalNav } from '@/components/global-nav';
import { formatDateline } from '@/lib/utils';

export default function EveningPage() {
  const [data, setData] = useState<EveningClose | null>(null);
  const [first, setFirst] = useState('');
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getEveningClose().then((d) => {
      setData(d);
      setFirst(d.tomorrowsFirstMove ?? '');
    });
  }, []);

  const save = async () => {
    if (!data) return;
    await api.saveEveningClose({ ...data, tomorrowsFirstMove: first });
    setSaved(true);
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlobalNav />
        <p className="dateline text-muted">Gathering the day…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNav />
      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="dateline text-muted mb-3">Evening close · {formatDateline(data.date)}</p>
            <h1 className="font-heading text-5xl sm:text-6xl font-light leading-[0.95] tracking-tight text-balance">
              How did the day land?
            </h1>
            <p className="font-reading text-lg text-muted mt-4">
              Ninety seconds. Three questions. Most of it is already done for you.
            </p>
          </motion.div>

          <div className="mt-16 space-y-14">
            {/* Q1 */}
            <Section
              n="01"
              title="What got decided"
              caption="Auto-populated from today's brief. Edit or strike through."
              active={step === 0}
              onFocus={() => setStep(0)}
            >
              <ul className="space-y-3">
                {data.decisionsMade.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 font-reading text-lg leading-relaxed"
                    data-testid={`evening-decision-${i}`}
                  >
                    <CheckCircle2 className="h-4 w-4 mt-2 text-primary shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
                {data.decisionsMade.length === 0 && (
                  <li className="font-reading italic text-muted">
                    Nothing got decided today.
                  </li>
                )}
              </ul>
            </Section>

            {/* Q2 */}
            <Section
              n="02"
              title="What's still open"
              caption="Will roll into tomorrow's brief automatically."
              active={step === 1}
              onFocus={() => setStep(1)}
            >
              <ul className="space-y-2 font-reading text-lg">
                {data.stillOpen.map((s, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-rule dark:border-dark-border pl-4 py-1 text-ink/80 dark:text-dark-fg/80"
                    data-testid={`evening-open-${i}`}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Q3 */}
            <Section
              n="03"
              title="Tomorrow's first move"
              caption="One sentence. The verb-first kind."
              active={step === 2}
              onFocus={() => setStep(2)}
            >
              <textarea
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                onFocus={() => setStep(2)}
                placeholder="Reply to Bharat before 9. Then everything else."
                className="w-full bg-transparent border-b border-rule dark:border-dark-border focus:border-primary outline-none font-reading text-xl leading-relaxed py-3 resize-none placeholder:italic placeholder:text-muted/60"
                rows={2}
                data-testid="evening-first-move"
              />
            </Section>

            <div className="flex items-center justify-between pt-4">
              <Link
                href="/"
                className="font-sans text-xs uppercase tracking-[0.2em] text-muted hover:text-ink dark:hover:text-dark-fg transition-colors"
                data-testid="evening-back"
              >
                ← Back to brief
              </Link>
              <button
                onClick={save}
                disabled={!first}
                className="group flex items-center gap-3 font-sans text-sm uppercase tracking-[0.18em] border border-ink dark:border-dark-fg px-6 py-3 hover:bg-ink hover:text-paper dark:hover:bg-dark-fg dark:hover:text-dark-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="evening-save"
              >
                {saved ? 'Closed for the day' : 'Close the day'}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  n,
  title,
  caption,
  children,
  active,
  onFocus
}: {
  n: string;
  title: string;
  caption: string;
  children: React.ReactNode;
  active: boolean;
  onFocus: () => void;
}) {
  return (
    <section
      className={`space-y-4 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-65'}`}
      onClick={onFocus}
    >
      <div className="flex items-baseline gap-4">
        <span className="font-sans text-xs font-bold tracking-[0.22em] text-primary">{n}</span>
        <h2 className="font-heading text-2xl font-medium">{title}</h2>
      </div>
      <p className="dateline text-muted">{caption}</p>
      <div className="pl-0 pt-2">{children}</div>
    </section>
  );
}
