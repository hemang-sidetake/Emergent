'use client';
import { motion } from 'framer-motion';
import type { Brief } from '@/lib/types';
import { Mail, MessageSquare } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
};

interface Props {
  brief: Brief;
}

export function MorningBrief({ brief }: Props) {
  return (
    <article className="w-full max-w-reading mx-auto space-y-16" data-testid="morning-brief">
      {/* SECTION 1 — One thing today */}
      <motion.section
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.05 }}
        className="space-y-4"
        data-testid="section-one-thing"
      >
        <SectionLabel index="01" label="The one thing today" />
        <h2 className="font-heading font-medium text-[clamp(2rem,4.2vw,3rem)] leading-[1.1] tracking-tight text-balance">
          {brief.oneThing.headline}
        </h2>
        <p className="font-reading text-lg leading-relaxed text-ink/85 dark:text-dark-fg/85 drop-cap">
          {brief.oneThing.reasoning}
        </p>
      </motion.section>

      <Hairline />

      {/* SECTION 2 — Three to handle personally */}
      <motion.section
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.15 }}
        className="space-y-7"
        data-testid="section-handle-personally"
      >
        <SectionLabel index="02" label="Three to handle personally" />
        <ol className="space-y-7">
          {brief.handlePersonally.map((item, i) => (
            <li
              key={i}
              className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1"
              data-testid={`handle-item-${i}`}
            >
              <span className="font-heading text-3xl font-light text-primary/80 leading-none pt-1">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-sans font-bold text-muted">
                  {item.source === 'email' ? (
                    <Mail className="h-3 w-3" />
                  ) : (
                    <MessageSquare className="h-3 w-3" />
                  )}
                  <span>{item.from}</span>
                  <span className="opacity-50">·</span>
                  <span className="opacity-70">{item.source}</span>
                </div>
                <h3 className="font-heading text-xl font-medium leading-snug text-balance">
                  {item.subject}
                </h3>
                <p className="font-reading text-base leading-relaxed text-ink/75 dark:text-dark-fg/75">
                  {item.why}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </motion.section>

      <Hairline />

      {/* SECTION 3 — One to cancel */}
      <motion.section
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.25 }}
        className="space-y-4"
        data-testid="section-to-cancel"
      >
        <SectionLabel index="03" label="One to cancel" />
        <div className="border-l-2 border-primary pl-5">
          <h3 className="font-heading text-2xl font-medium leading-tight">
            <span className="line-through decoration-[1.5px] decoration-primary/60 text-ink/55 dark:text-dark-fg/55">
              {brief.toCancel.meeting}
            </span>
            <span className="text-muted font-sans text-sm uppercase tracking-[0.18em] ml-3 align-middle">
              {brief.toCancel.time}
            </span>
          </h3>
          <p className="font-reading text-base leading-relaxed text-ink/85 dark:text-dark-fg/85 mt-2">
            {brief.toCancel.reason}
          </p>
        </div>
      </motion.section>

      <Hairline />

      {/* SECTION 4 — One to revive */}
      <motion.section
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.35 }}
        className="space-y-4"
        data-testid="section-to-revive"
      >
        <SectionLabel index="04" label="One to revive" />
        <div className="bg-accent/60 dark:bg-dark-card border border-rule dark:border-dark-border px-6 py-5">
          <div className="flex items-baseline justify-between gap-4 mb-1">
            <h3 className="font-heading text-xl font-medium leading-snug text-balance">
              {brief.toRevive.item}
            </h3>
            <span className="dateline text-muted whitespace-nowrap">
              {brief.toRevive.lastTouched}
            </span>
          </div>
          <p className="font-reading text-base leading-relaxed mt-2">
            {brief.toRevive.suggestedAction}
          </p>
        </div>
      </motion.section>

      {/* Colophon */}
      <motion.footer
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.5 }}
        className="pt-8 pb-2 text-center"
      >
        <div className="hairline mb-6" />
        <p className="dateline text-muted">
          Synthesized by {brief.model} · {brief.latencyMs}ms · {brief.scoresPreview.length} items
          considered
        </p>
        <p className="font-reading italic text-sm text-muted mt-3">
          End of brief. Close the tab. Do the work.
        </p>
      </motion.footer>
    </article>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-sans text-xs font-bold tracking-[0.22em] text-primary">{index}</span>
      <span className="hairline flex-1" />
      <span className="dateline text-muted">{label.toUpperCase()}</span>
    </div>
  );
}

function Hairline() {
  return <div className="hairline" />;
}
