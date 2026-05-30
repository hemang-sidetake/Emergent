'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Star, Inbox } from 'lucide-react';
import { api } from '@/lib/api';
import type { Brief } from '@/lib/types';
import { GlobalNav } from '@/components/global-nav';

export default function EmailMockupPage() {
  const [brief, setBrief] = useState<Brief | null>(null);
  useEffect(() => {
    api.brief({}, false).then(setBrief).catch(() => null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper dark:bg-dark-bg">
      <GlobalNav />
      <main className="flex-1 pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="font-sans text-xs uppercase tracking-[0.18em] text-muted hover:text-ink dark:hover:text-dark-fg inline-flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="h-3 w-3" /> Back to brief
          </Link>

          <p className="dateline text-muted mb-2">Imagine this in</p>
          <h1 className="font-heading text-5xl font-light tracking-tight mb-8">Email.</h1>
          <p className="font-reading text-lg text-muted mb-10">
            Same brief, delivered to her inbox. For the founder who lives in Gmail by accident.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-dark-card border border-rule dark:border-dark-border shadow-xl overflow-hidden"
            data-testid="email-mockup"
          >
            {/* Email toolbar */}
            <div className="px-5 py-3 border-b border-rule dark:border-dark-border bg-accent/60 dark:bg-dark-card flex items-center gap-3 text-xs">
              <Inbox className="h-3.5 w-3.5 text-muted" />
              <span className="font-sans text-muted">Inbox · 7:00 AM</span>
            </div>

            <div className="px-7 py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-2xl font-medium">Today's brief — four sections.</h2>
                <Star className="h-4 w-4 text-primary fill-primary" />
              </div>
              <div className="flex items-center gap-3 mb-6 text-xs font-sans text-muted">
                <span className="font-bold text-ink dark:text-dark-fg">The Morning Dispatch</span>
                <span>&lt;daily@morningdispatch.com&gt;</span>
                <span>·</span>
                <span>to Priya</span>
              </div>

              {brief && (
                <div className="font-reading text-[17px] leading-relaxed text-ink/90 dark:text-dark-fg/90 space-y-5">
                  <p>Priya,</p>

                  <p>
                    <strong className="font-heading text-xl block mb-1">
                      {brief.oneThing.headline}
                    </strong>
                    {brief.oneThing.reasoning}
                  </p>

                  <p className="font-bold font-sans text-xs uppercase tracking-[0.18em] text-muted mt-7 mb-2">
                    Three for you, personally
                  </p>
                  <ol className="space-y-2 list-decimal list-inside">
                    {brief.handlePersonally.map((h, i) => (
                      <li key={i}>
                        <strong>{h.from}</strong> — {h.subject}.{' '}
                        <span className="text-ink/70 dark:text-dark-fg/70">{h.why}</span>
                      </li>
                    ))}
                  </ol>

                  <p>
                    <span className="font-bold font-sans text-xs uppercase tracking-[0.18em] text-muted block mb-1">
                      Cancel
                    </span>
                    <s className="opacity-60">{brief.toCancel.meeting}</s> at{' '}
                    <strong>{brief.toCancel.time}</strong>. {brief.toCancel.reason}.
                  </p>

                  <p>
                    <span className="font-bold font-sans text-xs uppercase tracking-[0.18em] text-muted block mb-1">
                      Revive
                    </span>
                    {brief.toRevive.item} — last touched {brief.toRevive.lastTouched}.{' '}
                    {brief.toRevive.suggestedAction}
                  </p>

                  <p className="text-muted italic pt-4">— Your Chief of Staff</p>
                </div>
              )}
            </div>

            <div className="px-7 py-3 border-t border-rule dark:border-dark-border bg-accent/30 dark:bg-dark-card font-sans text-xs text-muted">
              Unsubscribe · This brief was synthesized by The Morning Dispatch.
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
